import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { adminFallbackStore, FallbackAuditLog } from "@/lib/admin/fallback-store";

export class AdminAuditRepository {
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

  static async logAction(
    action: string,
    entityType: string,
    entityId: string | null = null,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      const logEntry: FallbackAuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        actor_id: user?.id || null,
        actor_email: user?.email || "admin@vocabee.site",
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("admin_audit_logs" as any).insert(logEntry);
      } catch {
        adminFallbackStore.auditLogs.unshift(logEntry);
      }
    } catch {
      // Never fail the caller if audit logging encounters an issue
    }
  }

  static async getLogs(page: number = 1, pageSize: number = 20, entityType?: string) {
    try {
      const supabase = await this.getSupabase();
      let query = supabase
        .from("admin_audit_logs" as any)
        .select("*", { count: "exact" });

      if (entityType && entityType !== "all") {
        query = query.eq("entity_type", entityType);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!error) {
        return {
          data: (data || []) as unknown as FallbackAuditLog[],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
          isDatabaseLive: true,
        };
      }
    } catch {}

    let logs = [...adminFallbackStore.auditLogs];
    if (entityType && entityType !== "all") {
      logs = logs.filter((l) => l.entity_type === entityType);
    }
    const count = logs.length;
    const sliced = logs.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: sliced,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize) || 1,
      isDatabaseLive: false,
    };
  }
}
