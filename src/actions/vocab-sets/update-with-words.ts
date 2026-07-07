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
  word: z.string().min(1, "Tá»« vá»±ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng"),
  meaning: z.string().min(1, "NghÄ©a khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng"),
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
      error: "KhÃ´ng tÃ¬m tháº¥y bá»™ tá»« vá»±ng hoáº·c báº¡n khÃ´ng cÃ³ quyá»n chá»‰nh sá»­a.",
    };
  }

  const validatedFields = vocabSetSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dá»¯ liá»‡u bá»™ tá»« vá»±ng khÃ´ng há»£p lá»‡. Vui lÃ²ng kiá»ƒm tra láº¡i.",
    };
  }

  const validatedWordsResult = z.array(vocabularyFormItemSchema).safeParse(words);
  if (!validatedWordsResult.success) {
    return {
      success: false,
      error: "Dá»¯ liá»‡u danh sÃ¡ch tá»« vá»±ng khÃ´ng há»£p lá»‡. Vui lÃ²ng kiá»ƒm tra láº¡i.",
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
      console.log("[AI Import] Database save", {
        queryMs: Math.round(queryMs),
        mappingMs: Math.round(mappingMs),
        saveMs: Math.round(saveMs),
        rows: toInsert.length,
      });
    }
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: `Chá»‰nh sá»­a tháº¥t báº¡i: ${err.message}`,
    };
  }

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${setId}`);
  return { success: true };
}
