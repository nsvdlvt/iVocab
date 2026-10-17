import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { adminFallbackStore, FallbackSetting } from "@/lib/admin/fallback-store";

export class AdminSettingsRepository {
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

  static async getAllSettings(): Promise<{ settings: Record<string, FallbackSetting>; isDatabaseLive: boolean }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase.from("admin_settings" as any).select("*");
      if (!error && data && data.length > 0) {
        const result: Record<string, FallbackSetting> = {};
        for (const item of data as unknown as FallbackSetting[]) {
          result[item.key] = item;
        }
        return { settings: result, isDatabaseLive: true };
      }
      if (!error) {
        return { settings: adminFallbackStore.settings, isDatabaseLive: true };
      }
    } catch {}

    return { settings: adminFallbackStore.settings, isDatabaseLive: false };
  }

  static async updateSetting(
    key: string,
    value: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from("admin_settings" as any)
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Lỗi cập nhật cấu hình hệ thống" };
    }
  }
}
