"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { vocabSetSchema, type VocabSetFormValues } from "@/lib/validators/vocab-set";
import { generateVocabSetId } from "@/lib/id/generate-vocab-set-id";
import { getRandomVocabularySetColor } from "@/constants/vocab-set";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { performance } from "perf_hooks";

const vocabularyFormItemSchema = z.object({
  word: z.string().min(1, "Từ vựng không được để trống"),
  meaning: z.string().min(1, "Nghĩa không được để trống"),
  ipa: z.string().optional().or(z.literal("")),
  partOfSpeech: z.string().optional().or(z.literal("")),
  example: z.string().optional().or(z.literal("")),
  synonyms: z.string().optional().or(z.literal("")),
  antonyms: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
  example_translation: z.string().optional().or(z.literal("")),
});

export async function createVocabularySet(
  values: VocabSetFormValues,
  words?: Array<{
    word: string;
    meaning: string;
    ipa?: string;
    partOfSpeech?: string;
    example?: string;
    synonyms?: string;
    antonyms?: string;
    note?: string;
    example_translation?: string;
  }>
) {
  const profile = await requireUser();
  const userId = profile.id;

  // 1. Validate Vocabulary Set metadata
  const validatedFields = vocabSetSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu bộ từ vựng không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  // 2. Validate Vocabulary Items if provided
  let validatedWords: Array<z.infer<typeof vocabularyFormItemSchema>> = [];
  if (words && words.length > 0) {
    const validatedWordsResult = z.array(vocabularyFormItemSchema).safeParse(words);
    if (!validatedWordsResult.success) {
      return {
        success: false,
        error: "Dữ liệu danh sách từ vựng không hợp lệ. Vui lòng kiểm tra lại.",
      };
    }
    validatedWords = validatedWordsResult.data;
  }

  const { title, description, source_language, target_language, visibility } = validatedFields.data;

  // Automatically assign BookOpen as default icon & random color
  const finalColor = getRandomVocabularySetColor();
  const finalIcon = "BookOpen";

  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let errorMsg = "";
  let generatedId = "";

  while (attempts < maxAttempts && !success) {
    attempts++;
    generatedId = generateVocabSetId();
    try {
      await VocabSetRepository.createVocabSet(generatedId, userId, {
        title,
        description: description || null,
        source_language,
        target_language,
        color: finalColor,
        icon: finalIcon,
        visibility,
        source: "manual",
      });
      success = true;
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "23505" && attempts < maxAttempts) {
        console.warn(`⚠️ Trùng khóa chính ID (${generatedId}). Đang thử lại lần ${attempts + 1}...`);
        continue;
      }
      errorMsg = err.message || "Đã xảy ra lỗi khi tạo bộ từ.";
      break;
    }
  }

  if (!success) {
    return {
      success: false,
      error: `Không thể tạo bộ từ vựng sau ${maxAttempts} lần thử. Lỗi: ${errorMsg}`,
    };
  }

  // 3. Insert vocabulary items if provided
  if (validatedWords.length > 0) {
    try {
      const mappingStart = performance.now();
      const dbItems = validatedWords.map((item) => ({
        set_id: generatedId,
        owner_id: userId,
        word: item.word,
        meaning: item.meaning,
        ipa: item.ipa || null,
        part_of_speech: item.partOfSpeech || null,
        example: item.example || null,
        example_translation: item.example_translation || null,
        synonyms: item.synonyms ? item.synonyms.split(",").map((s) => s.trim()).filter(Boolean) : null,
        antonyms: item.antonyms ? item.antonyms.split(",").map((s) => s.trim()).filter(Boolean) : null,
        note: item.note || null,
        source: "manual" as const,
      }));
      const mappingMs = performance.now() - mappingStart;

      const saveStart = performance.now();
      await VocabularyRepository.bulkInsert(dbItems);
      const saveMs = performance.now() - saveStart;
      if (process.env.NODE_ENV === "development") {
        console.log("[AI Import] Database save", {
          mappingMs: Math.round(mappingMs),
          saveMs: Math.round(saveMs),
          rows: dbItems.length,
        });
      }
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: `Tạo bộ từ vựng thành công nhưng lỗi chèn từ vựng con: ${err.message}`,
        setId: generatedId,
      };
    }
  }

  revalidatePath("/vocabulary");
  return { success: true, setId: generatedId };
}
