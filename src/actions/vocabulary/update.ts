"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

type UpdateVocabularyInput = {
  word: string;
  meaning: string;
  ipa?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
  synonyms?: string[] | null;
  note?: string | null;
};

export async function updateVocabulary(id: string, values: UpdateVocabularyInput) {
  const user = await requireUser();
  const supabase = await createClient();

  const payload = {
    word: values.word.trim(),
    meaning: values.meaning.trim(),
    ipa: values.ipa?.trim() || null,
    part_of_speech: values.partOfSpeech?.trim() || null,
    example: values.example?.trim() || null,
    synonyms: values.synonyms ?? null,
    note: values.note?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("vocabularies")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message || "Không thể cập nhật từ vựng." };
  }

  revalidatePath("/vocabulary-management");
  revalidatePath("/vocabulary");
  return { success: true };
}
