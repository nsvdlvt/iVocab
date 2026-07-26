"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";

export async function toggleFavoriteVocabulary(vocabularyId: string, isFavorite: boolean) {
  const user = await requireUser();

  await VocabularyRepository.setFavoriteStatus(vocabularyId, user.id, isFavorite);

  return { success: true };
}
