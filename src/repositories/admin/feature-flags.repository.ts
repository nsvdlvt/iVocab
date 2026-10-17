import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { adminFallbackStore, FallbackFeatureFlag } from "@/lib/admin/fallback-store";

export class AdminFeatureFlagsRepository {
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

  static async getFlags(): Promise<{ flags: FallbackFeatureFlag[]; isDatabaseLive: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from("admin_feature_flags" as any)
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return { flags: data as unknown as FallbackFeatureFlag[], isDatabaseLive: true };
      }
      if (error) {
        return { flags: adminFallbackStore.featureFlags, isDatabaseLive: false, error: error.message };
      }
    } catch (e: unknown) {
      return { flags: adminFallbackStore.featureFlags, isDatabaseLive: false, error: String(e) };
    }

    return { flags: adminFallbackStore.featureFlags, isDatabaseLive: false };
  }

  static async toggleFlag(key: string, isEnabled: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("admin_feature_flags" as any)
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      return {
        success: false,
        error: `Lỗi cơ sở dữ liệu: ${error.message}. (Gợi ý: Nếu bảng chưa tồn tại trên Supabase, vui lòng chạy file migration 20261017_admin_console_tables_and_policies.sql trong SQL Editor)`,
      };
    }
    return { success: true };
  }
}
