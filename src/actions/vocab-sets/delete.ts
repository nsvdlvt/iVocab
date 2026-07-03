"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { revalidatePath } from "next/cache";

export async function deleteVocabularySet(id: string, isPermanent = false) {
  const profile = await requireUser();
  const userId = profile.id;

  try {
    if (isPermanent) {
      await VocabSetRepository.permanentDeleteVocabSet(id, userId);
    } else {
      await VocabSetRepository.softDeleteVocabSet(id, userId);
    }
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || "Đã xảy ra lỗi khi xóa bộ từ vựng.",
    };
  }

  revalidatePath("/vocabulary");
  return { success: true };
}
