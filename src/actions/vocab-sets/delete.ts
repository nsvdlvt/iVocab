"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { revalidatePath } from "next/cache";

export async function deleteVocabularySet(id: string, isPermanent = false) {
  const profile = await requireUser();
  const userId = profile.id;
  void isPermanent;

  try {
    await VocabSetRepository.deleteVocabSetCascade(id, userId);
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || "Đã xảy ra lỗi khi xóa bộ từ vựng.",
    };
  }

  revalidatePath("/vocabulary");
  revalidatePath("/vocabulary-management");
  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  revalidatePath("/review");
  return { success: true };
}
