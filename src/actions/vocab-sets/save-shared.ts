"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateVocabSetId } from "@/lib/id/generate-vocab-set-id";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";

export async function saveSharedVocabularySet(setId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      requiresAuth: true,
      error: "Authentication required",
    } as const;
  }

  const originalSet = await VocabSetRepository.getPublicVocabSetById(setId);
  if (!originalSet) {
    return {
      success: false,
      requiresAuth: false,
      error: "Không tìm thấy bộ từ vựng chia sẻ.",
    } as const;
  }

  const originalItems = await VocabularyRepository.getPublicBySetId(setId);
  const newSetId = generateVocabSetId();

  const copiedSet = await VocabSetRepository.createVocabSet(newSetId, user.id, {
    title: originalSet.title,
    description: originalSet.description,
    slug: originalSet.slug,
    source_language: originalSet.source_language,
    target_language: originalSet.target_language,
    color: originalSet.color,
    icon: originalSet.icon,
    visibility: originalSet.visibility ?? "private",
    source: originalSet.source ?? "shared",
  });

  if (originalItems.length > 0) {
    await VocabularyRepository.bulkInsert(
      originalItems.map((item) => ({
        set_id: copiedSet.id,
        owner_id: user.id,
        word: item.word,
        ipa: item.ipa,
        part_of_speech: item.part_of_speech,
        meaning: item.meaning,
        example: item.example,
        example_translation: item.example_translation,
        synonyms: item.synonyms,
        antonyms: item.antonyms,
        note: item.note,
        image_url: item.image_url,
        audio_url: item.audio_url,
        difficulty: item.difficulty,
        source: item.source ?? "shared",
      }))
    );
  }

  redirect(`/vocabulary/${copiedSet.id}`);
}
