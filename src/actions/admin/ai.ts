"use server";

import { assertAdmin } from "@/lib/auth/admin";
import { AdminAiRepository } from "@/repositories/admin/ai.repository";

export async function testLiveAiAction(promptText: string) {
  await assertAdmin();

  if (!promptText || promptText.trim().length === 0) {
    return { ok: false, error: "Nội dung prompt không được để trống" };
  }

  const result = await AdminAiRepository.testLiveAi(promptText.trim());
  return {
    ok: result.success,
    response: result.response,
    durationMs: result.durationMs,
    error: result.error,
  };
}

export const testLiveGeminiAction = testLiveAiAction;
