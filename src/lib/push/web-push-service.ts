import webpush from "web-push";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import {
  PushSubscriptionRepository,
  type ActiveSubscriptionRow,
} from "@/repositories/push-subscription.repository";

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  id?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface PushDeliverySummary {
  attempted: number;
  accepted: number;
  failed: number;
  deactivated: number;
}

export class WebPushService {
  private static isConfigured = false;

  private static configureVapid(): boolean {
    if (this.isConfigured) return true;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:support@vocabee.site";

    if (!publicKey || !privateKey) {
      console.warn("WebPushService: Missing VAPID credentials in environment.");
      return false;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isConfigured = true;
      return true;
    } catch (err) {
      console.error("WebPushService: Failed to configure VAPID details:", err);
      return false;
    }
  }

  /**
   * Sanitizes and bounds the push payload size (< 3KB)
   */
  static preparePayload(payload: PushNotificationPayload): string {
    const sanitized = {
      title: payload.title.slice(0, 120),
      body: payload.body.slice(0, 300),
      url: payload.url || "/notifications",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      tag: payload.tag || (payload.id ? `vocabee-${payload.id}` : "vocabee-notification"),
      id: payload.id,
    };
    return JSON.stringify(sanitized);
  }

  /**
   * Sends a push message to a single subscription with bounded retry
   */
  static async sendToSubscription(
    sub: ActiveSubscriptionRow,
    payloadString: string,
    priority: "low" | "normal" | "high" | "urgent" = "normal"
  ): Promise<{ status: "accepted" | "failed" | "expired"; statusCode?: number; error?: string }> {
    if (!this.configureVapid()) {
      return { status: "failed", error: "VAPID credentials not configured" };
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const options: webpush.RequestOptions = {
      TTL: priority === "urgent" ? 43200 : 86400, // 12h or 24h
      urgency: priority === "urgent" || priority === "high" ? "high" : "normal",
    };

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await webpush.sendNotification(
          pushSubscription,
          payloadString,
          options
        );

        await PushSubscriptionRepository.recordDeliverySuccess(sub.id);
        return { status: "accepted", statusCode: response.statusCode };
      } catch (err: any) {
        const statusCode = err.statusCode || err.status;

        // Permanent failures: Subscription is expired or unregistered
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscriptionRepository.recordDeliveryFailure(sub.id, true);
          return { status: "expired", statusCode, error: "Subscription expired or unsubscribed" };
        }

        // Rate-limiting or temporary server error: retry once
        if ((statusCode === 429 || statusCode >= 500) && attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, 500));
          continue;
        }

        // Generic failure
        await PushSubscriptionRepository.recordDeliveryFailure(sub.id, false);
        return {
          status: "failed",
          statusCode,
          error: err.message || "Push service error",
        };
      }
    }

    return { status: "failed", error: "Exceeded max delivery attempts" };
  }

  /**
   * Broadcast an announcement via Web Push to eligible active subscriptions
   */
  static async broadcastAnnouncement(
    announcement: {
      id: string;
      title: string;
      content: string;
      summary?: string | null;
      priority?: "low" | "normal" | "high" | "urgent";
      target_audience: "all" | "free" | "premium" | "admin";
      action_url?: string | null;
    }
  ): Promise<PushDeliverySummary> {
    const summary: PushDeliverySummary = {
      attempted: 0,
      accepted: 0,
      failed: 0,
      deactivated: 0,
    };

    if (!this.configureVapid()) {
      return summary;
    }

    // 1. Fetch eligible active subscriptions
    const subscriptions = await PushSubscriptionRepository.getActiveSubscriptionsForAudience(
      announcement.target_audience
    );

    if (subscriptions.length === 0) {
      return summary;
    }

    // 2. Prepare payload string
    const payloadString = this.preparePayload({
      id: announcement.id,
      title: announcement.title,
      body: announcement.summary || announcement.content,
      url: announcement.action_url || "/notifications",
      priority: announcement.priority,
    });

    // 3. Process in bounded batches of 20 to prevent socket exhaustion
    const BATCH_SIZE = 20;
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          summary.attempted++;

          const result = await this.sendToSubscription(
            sub,
            payloadString,
            announcement.priority
          );

          if (result.status === "accepted") {
            summary.accepted++;
          } else if (result.status === "expired") {
            summary.failed++;
            summary.deactivated++;
          } else {
            summary.failed++;
          }

          // Log delivery attempt into announcement_push_deliveries for idempotency
          try {
            await supabase.from("announcement_push_deliveries").insert({
              announcement_id: announcement.id,
              subscription_id: sub.id,
              user_id: sub.user_id,
              status: result.status,
              status_code: result.statusCode || null,
              error_message: result.error?.slice(0, 255) || null,
            });
          } catch {}
        })
      );
    }

    // 4. Update delivery statistics on admin_announcements
    try {
      await supabase
        .from("admin_announcements")
        .update({
          push_attempt_count: summary.attempted,
          push_success_count: summary.accepted,
          push_failure_count: summary.failed,
          push_delivered_at: new Date().toISOString(),
        })
        .eq("id", announcement.id);
    } catch {}

    return summary;
  }
}
