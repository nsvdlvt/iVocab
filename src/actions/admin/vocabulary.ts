"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function updateVocabSetAction(
  setId: string,
  updates: { title?: string; description?: string; visibility?: string; color?: string; icon?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminVocabularyRepository.updateSet(setId, updates);

    await AdminAuditRepository.logAction(
      "update_vocab_set",
      "vocab_set",
      setId,
      { updates, updatedBy: user.email }
    );

    revalidatePath("/admin/vocabulary-sets");
    revalidatePath(`/admin/vocabulary-sets/${setId}`);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteVocabSetAction(setId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminVocabularyRepository.deleteSet(setId);

    await AdminAuditRepository.logAction(
      "delete_vocab_set",
      "vocab_set",
      setId,
      { deletedBy: user.email }
    );

    revalidatePath("/admin/vocabulary-sets");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateVocabWordAction(
  wordId: string,
  updates: {
    word?: string;
    meaning?: string;
    ipa?: string;
    part_of_speech?: string;
    example?: string;
    example_translation?: string;
    difficulty?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminVocabularyRepository.updateWord(wordId, updates);

    await AdminAuditRepository.logAction(
      "update_vocab_word",
      "vocabulary",
      wordId,
      { word: updates.word, updatedBy: user.email }
    );

    revalidatePath("/admin/vocabulary-words");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteVocabWordAction(wordId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminVocabularyRepository.deleteWord(wordId);

    await AdminAuditRepository.logAction(
      "delete_vocab_word",
      "vocabulary",
      wordId,
      { deletedBy: user.email }
    );

    revalidatePath("/admin/vocabulary-words");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
