"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { vocabSetSchema, type VocabSetFormValues } from "@/lib/validators/vocab-set";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Database } from "@/types/database";
import { performance } from "perf_hooks";

const vocabularyFormItemSchema = z.object({
  id: z.string().optional(),
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

export async function updateVocabularySetWithWords(
  setId: string,
  values: VocabSetFormValues,
  words: Array<{
    id?: string;
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

  const existingSet = await VocabSetRepository.getVocabSetById(setId, userId);
  if (!existingSet) {
    return {
      success: false,
      error: "Không tìm thấy bộ từ vựng hoặc bạn không có quyền chỉnh sửa.",
    };
  }

  const validatedFields = vocabSetSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu bộ từ vựng không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  const validatedWordsResult = z.array(vocabularyFormItemSchema).safeParse(words);
  if (!validatedWordsResult.success) {
    return {
      success: false,
      error: "Dữ liệu danh sách từ vựng không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  const { title, description, source_language, target_language, visibility } = validatedFields.data;
  const validatedWords = validatedWordsResult.data;

  try {
    await VocabSetRepository.updateVocabSet(setId, userId, {
      title,
      description: description || null,
      source_language,
      target_language,
      visibility,
      updated_at: new Date().toISOString(),
    });

    const queryStart = performance.now();
    const existingDbWords = await VocabularyRepository.getBySetId(setId, userId);
    const queryMs = performance.now() - queryStart;
    const existingDbIds = new Set(existingDbWords.map((w) => w.id));

    const clientWordIds = new Set(validatedWords.map((w) => w.id).filter(Boolean));
    const idsToDelete = [...existingDbIds].filter((id) => !clientWordIds.has(id));

    for (const deleteId of idsToDelete) {
      await VocabularyRepository.softDelete(deleteId, userId);
    }

    type InsertPayload = Omit<Database["public"]["Tables"]["vocabularies"]["Insert"], "id" | "created_at" | "updated_at">;
    const toInsert: InsertPayload[] = [];

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const mappingStart = performance.now();
    for (const item of validatedWords) {
      const mappedRow = {
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        ipa: item.ipa?.trim() || null,
        part_of_speech: item.partOfSpeech?.trim() || null,
        example: item.example?.trim() || null,
        example_translation: item.example_translation?.trim() || null,
        synonyms: item.synonyms ? item.synonyms.split(",").map((s) => s.trim()).filter(Boolean) : null,
        antonyms: item.antonyms ? item.antonyms.split(",").map((s) => s.trim()).filter(Boolean) : null,
        note: item.note?.trim() || null,
      };

      if (item.id && existingDbIds.has(item.id)) {
        const { error: updateErr } = await supabase
          .from("vocabularies")
          .update(mappedRow)
          .eq("id", item.id)
          .eq("owner_id", userId);

        if (updateErr) throw updateErr;
      } else {
        toInsert.push({
          ...mappedRow,
          set_id: setId,
          owner_id: userId,
          source: "manual",
        });
      }
    }
    const mappingMs = performance.now() - mappingStart;

    let saveMs = 0;
    if (toInsert.length > 0) {
      const saveStart = performance.now();
      await VocabularyRepository.bulkInsert(toInsert);
      saveMs = performance.now() - saveStart;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[VocabularyEditor] update payload", {
        setId,
        queryMs: Math.round(queryMs),
        mappingMs: Math.round(mappingMs),
        saveMs: Math.round(saveMs),
        updateRows: validatedWords.filter((item) => item.id && existingDbIds.has(item.id)).length,
        insertRows: toInsert.length,
        words: validatedWords.map((item) => ({
          id: item.id ?? null,
          word: item.word.trim(),
          meaning: item.meaning.trim(),
        })),
      });
    }
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: `Chỉnh sửa thất bại: ${err.message}`,
    };
  }

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${setId}`);
  return { success: true };
}
