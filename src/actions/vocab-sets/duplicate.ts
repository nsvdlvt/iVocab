"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set";
import { generateVocabSetId } from "@/lib/id/generate-vocab-set-id";
import { revalidatePath } from "next/cache";

export async function duplicateVocabularySet(id: string) {
  const profile = await requireUser();
  const userId = profile.id;

  try {
    // 1. Fetch original set
    const originalSet = await VocabSetRepository.getVocabSetById(id, userId);
    if (!originalSet) {
      return {
        success: false,
        error: "Không tìm thấy bộ từ vựng gốc.",
      };
    }

    // 2. Generate a new unique custom ID with retries
    let newSetId = "";
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let errorMsg = "";

    while (attempts < maxAttempts && !success) {
      attempts++;
      newSetId = generateVocabSetId();
      try {
        await VocabSetRepository.createVocabSet(newSetId, userId, {
          title: `${originalSet.title} (Bản sao)`,
          description: originalSet.description,
          source_language: originalSet.source_language,
          target_language: originalSet.target_language,
          color: originalSet.color,
          icon: originalSet.icon,
          visibility: originalSet.visibility,
          source: "manual",
        });
        success = true;
      } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === "23505" && attempts < maxAttempts) {
          console.warn(`⚠️ Trùng khóa chính ID (${newSetId}) khi sao chép. Đang thử lại lần ${attempts + 1}...`);
          continue;
        }
        errorMsg = err.message || "Đã xảy ra lỗi khi tạo bộ từ sao chép.";
        break;
      }
    }

    if (!success) {
      return {
        success: false,
        error: `Không thể tạo bộ từ vựng sao chép sau ${maxAttempts} lần thử. Lỗi: ${errorMsg}`,
      };
    }

    // 3. Fetch vocabulary items from original set
    const originalItems = await VocabSetRepository.getVocabularyItems(id, userId);

    // 4. Duplicate items if any exist
    if (originalItems.length > 0) {
      const duplicatedItems = originalItems.map(item => ({
        set_id: newSetId,
        owner_id: userId,
        word: item.word,
        meaning: item.meaning,
        ipa: item.ipa,
        part_of_speech: item.part_of_speech,
        example: item.example,
        example_translation: item.example_translation,
        synonyms: item.synonyms,
        antonyms: item.antonyms,
        note: item.note,
        image_url: item.image_url,
        audio_url: item.audio_url,
        difficulty: item.difficulty,
        source: "manual",
      }));

      await VocabSetRepository.bulkInsertVocabularyItems(duplicatedItems);
    }

    revalidatePath("/vocabulary");
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || "Đã xảy ra lỗi khi nhân bản bộ từ vựng.",
    };
  }
}
