import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { adminFallbackStore, FallbackAnnouncement } from "@/lib/admin/fallback-store";

export class AdminAnnouncementRepository {
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

  static async getAnnouncements(): Promise<{ announcements: FallbackAnnouncement[]; isDatabaseLive: boolean }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from("admin_announcements" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return { announcements: data as unknown as FallbackAnnouncement[], isDatabaseLive: true };
      }
    } catch {}

    return { announcements: adminFallbackStore.announcements, isDatabaseLive: false };
  }

  static async createAnnouncement(payload: {
    title: string;
    content: string;
    summary?: string | null;
    type: "info" | "warning" | "success" | "broadcast";
    priority?: "low" | "normal" | "high" | "urgent";
    target_audience: "all" | "free" | "premium" | "admin";
    status?: "draft" | "scheduled" | "published" | "archived";
    is_active?: boolean;
    action_url?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    created_by?: string | null;
    delivery_channels?: "in_app" | "push" | "both";
  }): Promise<{ ok: boolean; data?: FallbackAnnouncement; error?: string }> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const status = payload.status || (payload.is_active ? "published" : "draft");
    const isActive = status === "published";
    const publishedAt = status === "published" ? now : null;

    const item: FallbackAnnouncement = {
      id: newId,
      title: payload.title.trim(),
      content: payload.content.trim(),
      summary: payload.summary?.trim() || null,
      type: payload.type,
      priority: payload.priority || "normal",
      target_audience: payload.target_audience,
      status,
      is_active: isActive,
      action_url: payload.action_url?.trim() || null,
      published_at: publishedAt,
      start_at: payload.start_at || now,
      end_at: payload.end_at || null,
      created_by: payload.created_by || null,
      delivery_channels: payload.delivery_channels || "in_app",
      push_attempt_count: 0,
      push_success_count: 0,
      push_failure_count: 0,
      push_delivered_at: null,
      created_at: now,
      updated_at: now,
    };

    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from("admin_announcements" as any)
        .insert(item)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, data: (data as unknown as FallbackAnnouncement) || item };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể thêm thông báo vào cơ sở dữ liệu" };
    }
  }

  static async updateAnnouncement(
    id: string,
    updates: Partial<FallbackAnnouncement>
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.status === "published" && !updates.published_at) {
        payload.published_at = new Date().toISOString();
        payload.is_active = true;
      } else if (updates.status === "draft" || updates.status === "archived") {
        payload.is_active = false;
      }

      const { error } = await supabase
        .from("admin_announcements" as any)
        .update(payload)
        .eq("id", id);

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể cập nhật thông báo trên cơ sở dữ liệu" };
    }
  }

  static async publishAnnouncement(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("admin_announcements" as any)
        .update({
          status: "published",
          is_active: true,
          published_at: now,
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể phát hành thông báo" };
    }
  }

  static async archiveAnnouncement(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("admin_announcements" as any)
        .update({
          status: "archived",
          is_active: false,
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể lưu trữ thông báo" };
    }
  }

  static async deleteAnnouncement(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase.from("admin_announcements" as any).delete().eq("id", id);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể xóa thông báo trên cơ sở dữ liệu" };
    }
  }

  static async getAudienceEstimate(audience: "all" | "free" | "premium" | "admin"): Promise<number> {
    try {
      const supabase = await this.getSupabase();
      let query = supabase.from("profiles").select("id", { count: "exact", head: true });

      if (audience === "admin") {
        query = query.eq("role", "admin");
      } else if (audience === "free" || audience === "premium") {
        query = query.neq("role", "admin");
      }

      const { count, error } = await query;
      if (!error && typeof count === "number") {
        return count;
      }
    } catch {}
    return 1;
  }
}
