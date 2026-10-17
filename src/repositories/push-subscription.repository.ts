import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  deviceName?: string | null;
}

export interface ActiveSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_name: string | null;
}

export class PushSubscriptionRepository {
  private static async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
  }

  /**
   * Upsert a push subscription for the authenticated user
   */
  static async upsertSubscription(
    userId: string,
    data: PushSubscriptionData
  ): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      const { data: row, error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: userId,
            endpoint: data.endpoint,
            p256dh: data.p256dh,
            auth: data.auth,
            user_agent: data.userAgent?.slice(0, 500) || null,
            device_name: data.deviceName?.slice(0, 100) || null,
            is_active: true,
            updated_at: now,
          },
          { onConflict: "endpoint" }
        )
        .select("id")
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, id: row?.id };
    } catch (err: any) {
      return { ok: false, error: err.message || "Lỗi khi lưu đăng ký Push" };
    }
  }

  /**
   * Deactivate a push subscription by endpoint for a user
   */
  static async deactivateSubscription(
    userId: string,
    endpoint: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          is_active: false,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("endpoint", endpoint);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Lỗi khi hủy đăng ký Push" };
    }
  }

  /**
   * Check if an endpoint is active for a user
   */
  static async isEndpointActive(userId: string, endpoint: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { data } = await supabase
        .from("push_subscriptions")
        .select("is_active")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .single();

      return Boolean(data?.is_active);
    } catch {
      return false;
    }
  }

  /**
   * Get all active subscriptions matching audience targeting
   */
  static async getActiveSubscriptionsForAudience(
    audience: "all" | "free" | "premium" | "admin"
  ): Promise<ActiveSubscriptionRow[]> {
    try {
      const supabase = await this.getSupabase();

      // If audience is all, get all active subscriptions
      if (audience === "all") {
        const { data, error } = await supabase
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh, auth, device_name")
          .eq("is_active", true);

        if (error || !data) return [];
        return data as ActiveSubscriptionRow[];
      }

      // If audience is filtered by role (e.g. admin or free/learners)
      const targetRole = audience === "admin" ? "admin" : "user";
      const { data: eligibleProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", targetRole);

      if (!eligibleProfiles || eligibleProfiles.length === 0) return [];
      const userIds = eligibleProfiles.map((p) => p.id);

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth, device_name")
        .eq("is_active", true)
        .in("user_id", userIds);

      if (error || !data) return [];
      return data as ActiveSubscriptionRow[];
    } catch {
      return [];
    }
  }

  /**
   * Count active subscriptions matching audience
   */
  static async countActiveSubscriptions(
    audience: "all" | "free" | "premium" | "admin"
  ): Promise<number> {
    try {
      const subs = await this.getActiveSubscriptionsForAudience(audience);
      return subs.length;
    } catch {
      return 0;
    }
  }

  /**
   * Record successful push delivery
   */
  static async recordDeliverySuccess(subscriptionId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      await supabase
        .from("push_subscriptions")
        .update({
          last_successful_delivery_at: now,
          failure_count: 0,
          updated_at: now,
        })
        .eq("id", subscriptionId);
    } catch {}
  }

  /**
   * Record push delivery failure. If permanently invalid (404/410), deactivate subscription.
   */
  static async recordDeliveryFailure(
    subscriptionId: string,
    isPermanentlyGone = false
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      if (isPermanentlyGone) {
        await supabase
          .from("push_subscriptions")
          .update({
            is_active: false,
            last_failure_at: now,
            updated_at: now,
          })
          .eq("id", subscriptionId);
      } else {
        await supabase
          .from("push_subscriptions")
          .update({
            last_failure_at: now,
            updated_at: now,
          })
          .eq("id", subscriptionId);
      }
    } catch {}
  }
}
