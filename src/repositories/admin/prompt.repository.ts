import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { adminFallbackStore, FallbackPrompt } from "@/lib/admin/fallback-store";
import { request as sendAiRequest } from "@/lib/ai/responsesClient";

export class AdminPromptRepository {
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

  static async getPrompts(): Promise<{ prompts: FallbackPrompt[]; isDatabaseLive: boolean }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from("admin_prompts" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return { prompts: data as unknown as FallbackPrompt[], isDatabaseLive: true };
      }
      if (!error) {
        return { prompts: adminFallbackStore.prompts, isDatabaseLive: true };
      }
    } catch {}

    return { prompts: adminFallbackStore.prompts, isDatabaseLive: false };
  }

  static async getPromptByKey(key: string): Promise<FallbackPrompt | null> {
    const { prompts } = await this.getPrompts();
    const active = prompts.find((p) => p.prompt_key === key && p.is_active);
    return active || prompts.find((p) => p.prompt_key === key) || null;
  }

  static async getPromptVersions(key: string): Promise<FallbackPrompt[]> {
    const { prompts } = await this.getPrompts();
    return prompts
      .filter((p) => p.prompt_key === key)
      .sort((a, b) => b.version - a.version);
  }

  static async createPromptVersion(
    promptKey: string,
    payload: {
      name: string;
      description: string;
      system_prompt: string;
      user_template: string;
      variables: string[];
    }
  ): Promise<{ ok: boolean; data?: FallbackPrompt; error?: string }> {
    const versions = await this.getPromptVersions(promptKey);
    const nextVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;

    const newPrompt: FallbackPrompt = {
      id: `prompt_${promptKey}_v${nextVersion}`,
      prompt_key: promptKey,
      version: nextVersion,
      name: payload.name,
      description: payload.description,
      system_prompt: payload.system_prompt,
      user_template: payload.user_template,
      variables: payload.variables,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await this.getSupabase();
      // Deactivate older versions
      await supabase
        .from("admin_prompts" as any)
        .update({ is_active: false })
        .eq("prompt_key", promptKey);

      const { error } = await supabase.from("admin_prompts" as any).insert(newPrompt);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, data: newPrompt };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể tạo phiên bản prompt mới trên cơ sở dữ liệu" };
    }
  }

  static async rollbackPrompt(promptKey: string, targetVersion: number): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const { error: deactivateErr } = await supabase
        .from("admin_prompts" as any)
        .update({ is_active: false })
        .eq("prompt_key", promptKey);

      if (deactivateErr) {
        return { ok: false, error: deactivateErr.message };
      }

      const { error: activateErr } = await supabase
        .from("admin_prompts" as any)
        .update({ is_active: true })
        .eq("prompt_key", promptKey)
        .eq("version", targetVersion);

      if (activateErr) {
        return { ok: false, error: activateErr.message };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Không thể hoàn tác phiên bản prompt trên cơ sở dữ liệu" };
    }
  }

  static async testPrompt(
    systemPrompt: string,
    userTemplate: string,
    variableValues: Record<string, string>
  ): Promise<{ response: string; durationMs: number }> {
    let renderedUser = userTemplate;
    for (const [k, v] of Object.entries(variableValues)) {
      renderedUser = renderedUser.replaceAll(`{{${k}}}`, v);
    }

    const start = performance.now();
    const promptInput = `${systemPrompt}\n\n---\n${renderedUser}`;
    const result = await sendAiRequest<string>({
      input: promptInput,
    });
    const durationMs = Math.round(performance.now() - start);

    return {
      response: typeof result === "string" ? result : JSON.stringify(result, null, 2),
      durationMs,
    };
  }
}
