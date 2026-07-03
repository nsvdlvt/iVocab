"use server";

import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { vocabSetSchema, type VocabSetFormValues } from "@/lib/validators/vocab-set";
import { revalidatePath } from "next/cache";

export async function updateVocabularySet(id: string, values: VocabSetFormValues) {
  const profile = await requireUser();
  const userId = profile.id;

  const validatedFields = vocabSetSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  const { title, description, source_language, target_language, color, icon, visibility } = validatedFields.data;

  try {
    await VocabSetRepository.updateVocabSet(id, userId, {
      title,
      description: description || null,
      source_language,
      target_language,
      color: color || null,
      icon: icon || null,
      visibility,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || "Đã xảy ra lỗi khi cập nhật bộ từ vựng.",
    };
  }

  revalidatePath("/vocabulary");
  return { success: true };
}
