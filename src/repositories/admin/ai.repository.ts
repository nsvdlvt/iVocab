import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { request as sendAiRequest } from "@/lib/ai/responsesClient";
import { adminFallbackStore, FallbackAiLog } from "@/lib/admin/fallback-store";
import { getAiApiKey, AI_MODEL } from "@/lib/ai/constants";

export interface AiTelemetryStats {
  totalRequests: number;
  successRate: number;
  avgDurationMs: number;
  totalTokens: number;
  estimatedCostUsd: number;
  activeProvider: string;
  configuredModel: string;
  isApiKeyConfigured: boolean;
  isDatabaseLive: boolean;
}

export class AdminAiRepository {
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

  static async getTelemetry(): Promise<AiTelemetryStats> {
    const apiKey = getAiApiKey();
    const isApiKeyConfigured = Boolean(apiKey && apiKey.length > 5);

    try {
      const supabase = await this.getSupabase();
      const { data, count, error } = await supabase
        .from("ai_usage_logs" as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        const logs = data as unknown as FallbackAiLog[];
        const total = count || logs.length;
        const successes = logs.filter((l) => l.status === "success").length;
        const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
        const totalDuration = logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0);
        const avgDuration = logs.length > 0 ? Math.round(totalDuration / logs.length) : 0;
        const totalTokens = logs.reduce((acc, l) => acc + (l.total_tokens || 0), 0);
        // Gemini 2.5 Flash pricing estimate: ~$0.075 per 1M tokens
        const estimatedCost = Number(((totalTokens / 1_000_000) * 0.075).toFixed(4));

        return {
          totalRequests: total,
          successRate,
          avgDurationMs: avgDuration,
          totalTokens,
          estimatedCostUsd: estimatedCost,
          activeProvider: "ModelAPI",
          configuredModel: AI_MODEL,
          isApiKeyConfigured,
          isDatabaseLive: true,
        };
      }
    } catch {
      // Fall through to fallback store
    }

    // Fallback store
    const logs = adminFallbackStore.aiLogs;
    const total = logs.length;
    const successes = logs.filter((l) => l.status === "success").length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
    const totalDuration = logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0);
    const avgDuration = logs.length > 0 ? Math.round(totalDuration / logs.length) : 0;
    const totalTokens = logs.reduce((acc, l) => acc + (l.total_tokens || 0), 0);
    const estimatedCost = Number(((totalTokens / 1_000_000) * 0.075).toFixed(4));

    return {
      totalRequests: total,
      successRate,
      avgDurationMs: avgDuration,
      totalTokens,
      estimatedCostUsd: estimatedCost,
      activeProvider: "ModelAPI",
      configuredModel: AI_MODEL,
      isApiKeyConfigured,
      isDatabaseLive: false,
    };
  }

  static async getLogs(page: number = 1, pageSize: number = 10) {
    try {
      const supabase = await this.getSupabase();
      const { data, count, error } = await supabase
        .from("ai_usage_logs" as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!error && data) {
        return {
          data: data as unknown as FallbackAiLog[],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      }
    } catch {}

    const logs = [...adminFallbackStore.aiLogs].reverse();
    const count = logs.length;
    const sliced = logs.slice((page - 1) * pageSize, page * pageSize);
    return {
      data: sliced,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize) || 1,
    };
  }

  static async recordLog(entry: Omit<FallbackAiLog, "id" | "created_at">) {
    const logItem: FallbackAiLog = {
      ...entry,
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await this.getSupabase();
      await supabase.from("ai_usage_logs" as any).insert(logItem);
    } catch {
      adminFallbackStore.aiLogs.push(logItem);
    }
  }

  static async testLiveGemini(promptText: string): Promise<{
    success: boolean;
    response?: string;
    durationMs: number;
    error?: string;
  }> {
    const start = performance.now();
    try {
      const res = await sendAiRequest<string>({
        input: promptText,
      });

      const durationMs = Math.round(performance.now() - start);
      const textOutput = typeof res === "string" ? res : JSON.stringify(res, null, 2);

      await this.recordLog({
        user_id: null,
        feature: "admin_test",
        provider: "modelapi",
        model: AI_MODEL,
        prompt_tokens: Math.round(promptText.length / 4),
        completion_tokens: Math.round(textOutput.length / 4),
        total_tokens: Math.round((promptText.length + textOutput.length) / 4),
        duration_ms: durationMs,
        status: "success",
        error_message: null,
        metadata: { prompt_snippet: promptText.slice(0, 50) },
      });

      return {
        success: true,
        response: textOutput,
        durationMs,
      };
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : String(err);

      await this.recordLog({
        user_id: null,
        feature: "admin_test",
        provider: "modelapi",
        model: AI_MODEL,
        prompt_tokens: Math.round(promptText.length / 4),
        completion_tokens: 0,
        total_tokens: Math.round(promptText.length / 4),
        duration_ms: durationMs,
        status: "error",
        error_message: errMsg,
        metadata: { prompt_snippet: promptText.slice(0, 50) },
      });

      return {
        success: false,
        durationMs,
        error: errMsg,
      };
    }
  }
}
