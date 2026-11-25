// src/lib/ai/agent/audit.ts
import { createClient } from "@/lib/supabase/server";
import type { AgentActionType } from "./types";

export interface AuditLogEntry {
  actionId: string;
  userId: string;
  actionType: AgentActionType | string;
  targetIds: string[];
  affectedCount: number;
  status: "pending" | "confirmed" | "cancelled" | "executed" | "failed" | "expired";
  summary: string;
  errorMessage?: string | null;
}

/**
 * Records an audit log entry for AI database-changing operations.
 * Never stores conversation text. Gracefully skips DB write if the migration
 * table has not yet been applied in the target Supabase environment.
 */
export async function recordAiActionAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await (supabase.from("ai_action_audit_logs" as never) as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
    }).insert({
      action_id: entry.actionId,
      user_id: entry.userId,
      action_type: entry.actionType,
      target_ids: entry.targetIds,
      affected_count: entry.affectedCount,
      status: entry.status,
      summary: entry.summary.slice(0, 500),
      error_message: entry.errorMessage ? entry.errorMessage.slice(0, 500) : null,
    });

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      console.warn("[ai/agent/audit] Audit insert warning:", error.message);
    }
  } catch (err) {
    console.warn(
      "[ai/agent/audit] Audit log skipped:",
      err instanceof Error ? err.message : String(err)
    );
  }
}
