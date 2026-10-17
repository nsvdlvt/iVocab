import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface UserNotificationItem {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  type: "info" | "warning" | "success" | "broadcast";
  priority: "low" | "normal" | "high" | "urgent";
  action_url: string | null;
  published_at: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  dismissed_at: string | null;
}

export class UserNotificationsRepository {
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
   * Sanitizes URLs to prevent XSS / malicious schemes like javascript:
   */
  static sanitizeActionUrl(url?: string | null): string | null {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    // Allow relative internal paths like /vocabulary or /review
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
    // Allow http/https only
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return trimmed;
      }
    } catch {}
    return null;
  }

  static async getUserNotifications(
    userId: string,
    filter: "all" | "unread" = "all",
    limit = 30
  ): Promise<{ items: UserNotificationItem[]; unreadCount: number }> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      // 1. Fetch eligible published announcements
      const { data: announcements, error: annError } = await supabase
        .from("admin_announcements" as any)
        .select("*")
        .eq("is_active", true)
        .or("status.eq.published,status.is.null")
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit * 2);

      if (annError || !announcements) {
        return { items: [], unreadCount: 0 };
      }

      // 2. Fetch user's read states
      const { data: readStates, error: readError } = await supabase
        .from("user_announcement_reads" as any)
        .select("announcement_id, read_at, dismissed_at")
        .eq("user_id", userId);

      const readMap = new Map<string, { read_at: string | null; dismissed_at: string | null }>();
      if (!readError && readStates) {
        for (const r of readStates as any[]) {
          readMap.set(r.announcement_id, {
            read_at: r.read_at,
            dismissed_at: r.dismissed_at,
          });
        }
      }

      // 3. Transform and calculate unread count
      let unreadCount = 0;
      const allItems: UserNotificationItem[] = [];

      for (const ann of announcements as any[]) {
        const userState = readMap.get(ann.id);
        const isDismissed = Boolean(userState?.dismissed_at);
        const isRead = Boolean(userState?.read_at);

        if (!isRead && !isDismissed) {
          unreadCount++;
        }

        // Skip dismissed notifications from user active views
        if (isDismissed) continue;

        allItems.push({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          summary: ann.summary || null,
          type: ann.type || "info",
          priority: ann.priority || "normal",
          action_url: this.sanitizeActionUrl(ann.action_url),
          published_at: ann.published_at || ann.created_at,
          created_at: ann.created_at,
          is_read: isRead,
          read_at: userState?.read_at || null,
          dismissed_at: userState?.dismissed_at || null,
        });
      }

      // 4. Apply unread filter if requested
      const filteredItems = filter === "unread"
        ? allItems.filter((item) => !item.is_read)
        : allItems;

      return {
        items: filteredItems.slice(0, limit),
        unreadCount,
      };
    } catch {
      return { items: [], unreadCount: 0 };
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { unreadCount } = await this.getUserNotifications(userId, "unread", 50);
    return unreadCount;
  }

  static async markAsRead(userId: string, announcementId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("user_announcement_reads" as any)
        .upsert(
          {
            user_id: userId,
            announcement_id: announcementId,
            read_at: now,
          },
          { onConflict: "user_id,announcement_id" }
        );

      return !error;
    } catch {
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      // Get all active announcements visible to user
      const { data: announcements, error: annError } = await supabase
        .from("admin_announcements" as any)
        .select("id")
        .eq("is_active", true)
        .or("status.eq.published,status.is.null");

      if (annError || !announcements || announcements.length === 0) {
        return true;
      }

      const rows = (announcements as any[]).map((a) => ({
        user_id: userId,
        announcement_id: a.id,
        read_at: now,
      }));

      const { error } = await supabase
        .from("user_announcement_reads" as any)
        .upsert(rows, { onConflict: "user_id,announcement_id" });

      return !error;
    } catch {
      return false;
    }
  }

  static async dismissNotification(userId: string, announcementId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("user_announcement_reads" as any)
        .upsert(
          {
            user_id: userId,
            announcement_id: announcementId,
            dismissed_at: now,
            read_at: now,
          },
          { onConflict: "user_id,announcement_id" }
        );

      return !error;
    } catch {
      return false;
    }
  }
}
