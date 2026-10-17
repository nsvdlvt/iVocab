"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminPromptRepository } from "@/repositories/admin/prompt.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function createPromptVersionAction(
  promptKey: string,
  payload: {
    name: string;
    description: string;
    system_prompt: string;
    user_template: string;
    variables: string[];
  }
) {
  try {
    const { user } = await assertAdmin();

    if (!payload.system_prompt || !payload.user_template) {
      return { ok: false, error: "System Prompt và User Template không được để trống" };
    }

    const res = await AdminPromptRepository.createPromptVersion(promptKey, payload);
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || "Lỗi khi lưu phiên bản prompt" };
    }

    try {
      await AdminAuditRepository.logAction(
        "create_prompt_version",
        "prompt",
        res.data.id,
        { promptKey, version: res.data.version, updatedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/prompts");
    return { ok: true, version: res.data.version };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function rollbackPromptVersionAction(promptKey: string, targetVersion: number) {
  try {
    const { user } = await assertAdmin();

    const res = await AdminPromptRepository.rollbackPrompt(promptKey, targetVersion);
    if (!res.ok) {
      return { ok: false, error: res.error || "Lỗi khi hoàn tác phiên bản prompt" };
    }

    try {
      await AdminAuditRepository.logAction(
        "rollback_prompt_version",
        "prompt",
        `${promptKey}_v${targetVersion}`,
        { promptKey, targetVersion, updatedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/prompts");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function testPromptLiveAction(
  systemPrompt: string,
  userTemplate: string,
  variables: Record<string, string>
) {
  try {
    await assertAdmin();

    const result = await AdminPromptRepository.testPrompt(systemPrompt, userTemplate, variables);
    return { ok: true, response: result.response, durationMs: result.durationMs };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
