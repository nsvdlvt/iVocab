// src/lib/ai/agent/executor.ts
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { generateVocabSetId } from "@/lib/id/generate-vocab-set-id";
import { getRandomVocabularySetColor } from "@/constants/vocab-set";
import { normalizeVocabularyWord } from "@/lib/validation/vocabulary-duplicates";
import {
  markConfirmationConsumed,
  verifyConfirmationToken,
} from "./confirmation";
import { recordAiActionAudit } from "./audit";
import type { AgentActionType } from "./types";
import type { VocabeeTest } from "@/types/vocabee-test";
import { normalizeDbDifficulty } from "./tools/shared";

export interface ConfirmedActionExecutionResult {
  success: boolean;
  message: string;
  action: AgentActionType;
  actionId: string;
  affectedCount: number;
  targetIds: string[];
  actionUrl?: string;
  statusCode?: number;
}

export async function executeConfirmedAgentAction(
  userId: string,
  input: {
    token: string;
    action: AgentActionType;
    actionId: string;
  }
): Promise<ConfirmedActionExecutionResult> {
  const verification = verifyConfirmationToken(
    input.token,
    input.action,
    input.actionId,
    userId
  );

  if (!verification.valid) {
    await recordAiActionAudit({
      actionId: input.actionId || "unknown",
      userId,
      actionType: input.action,
      targetIds: [],
      affectedCount: 0,
      status: verification.expired ? "expired" : "failed",
      summary: `Rejected confirmation: ${verification.reason}`,
      errorMessage: verification.reason,
    });

    return {
      success: false,
      message: verification.reason,
      action: input.action,
      actionId: input.actionId,
      affectedCount: 0,
      targetIds: [],
      statusCode: verification.expired ? 410 : 403,
    };
  }

  const { payload } = verification;
  const params = payload.params;
  const supabase = await createClient();

  try {
    let message = "";
    let affectedCount = 0;
    let targetIds: string[] = [];
    let actionUrl: string | undefined;

    switch (payload.action) {
      case "create_vocabulary_set": {
        const title = String(params.title || "").trim();
        const description = (params.description as string | null) ?? null;
        const source_language = String(params.source_language || "en");
        const target_language = String(params.target_language || "vi");
        const visibility = (params.visibility as "private" | "unlisted" | "public") || "private";
        const words = Array.isArray(params.words)
          ? (params.words as Array<Record<string, unknown>>)
          : [];

        let setId = "";
        let created = false;
        for (let attempt = 0; attempt < 3 && !created; attempt++) {
          setId = generateVocabSetId();
          try {
            await VocabSetRepository.createVocabSet(setId, userId, {
              title,
              description,
              source_language,
              target_language,
              color: getRandomVocabularySetColor(),
              icon: "BookOpen",
              visibility,
              source: "ai",
            });
            created = true;
          } catch (err) {
            if ((err as { code?: string }).code !== "23505" || attempt === 2) {
              throw err;
            }
          }
        }

        if (words.length > 0) {
          const rows = words.map((w) => ({
            set_id: setId,
            owner_id: userId,
            word: String(w.word || "").trim(),
            meaning: String(w.meaning || "").trim(),
            ipa: (w.ipa as string | null) ?? null,
            part_of_speech: (w.part_of_speech as string | null) ?? null,
            example: (w.example as string | null) ?? null,
            example_translation: (w.example_translation as string | null) ?? null,
            synonyms: Array.isArray(w.synonyms) ? (w.synonyms as string[]) : null,
            antonyms: Array.isArray(w.antonyms) ? (w.antonyms as string[]) : null,
            note: (w.note as string | null) ?? null,
            difficulty: normalizeDbDifficulty(w.difficulty as string | null),
            source: "ai" as const,
          }));

          try {
            await VocabularyRepository.bulkInsert(rows);
          } catch (insertErr) {
            // Rollback empty set to avoid partial write
            await VocabSetRepository.permanentDeleteVocabSet(setId, userId).catch(() => {});
            throw insertErr;
          }
        }

        affectedCount = 1 + words.length;
        targetIds = [setId];
        actionUrl = `/u/vocabulary/${setId}`;
        message =
          words.length > 0
            ? `Đã tạo bộ từ "${title}" kèm ${words.length} từ vựng thành công.`
            : `Đã tạo bộ từ "${title}" thành công.`;
        break;
      }

      case "update_vocabulary_set": {
        const setId = String(params.setId || "");
        const existing = await VocabSetRepository.getVocabSetById(setId, userId);
        if (!existing || existing.deleted_at) {
          return {
            success: false,
            message: "Bộ từ vựng không tồn tại hoặc không thuộc tài khoản của bạn.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        const updates = (params.updates as Record<string, unknown>) || {};
        await VocabSetRepository.updateVocabSet(setId, userId, {
          ...updates,
          updated_at: new Date().toISOString(),
        });
        affectedCount = 1;
        targetIds = [setId];
        actionUrl = `/u/vocabulary/${setId}`;
        message = `Đã cập nhật bộ từ "${String(updates.title || existing.title)}" thành công.`;
        break;
      }

      case "delete_vocabulary_set": {
        const setId = String(params.setId || "");
        const existing = await VocabSetRepository.getVocabSetById(setId, userId);
        if (!existing || existing.deleted_at) {
          return {
            success: false,
            message: "Bộ từ vựng không còn tồn tại hoặc đã bị xóa trước đó.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        await VocabSetRepository.deleteVocabSetCascade(setId, userId);
        affectedCount = 1 + Number(params.wordCount || 0);
        targetIds = [setId];
        message = `Đã xóa bộ từ "${existing.title}" thành công.`;
        break;
      }

      case "create_vocabulary_word": {
        const setId = String(params.setId || "");
        const existingSet = await VocabSetRepository.getVocabSetById(setId, userId);
        if (!existingSet || existingSet.deleted_at) {
          return {
            success: false,
            message: "Bộ từ vựng đích không còn tồn tại.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        const existingWords = await VocabularyRepository.getBySetId(setId, userId);
        const normWord = normalizeVocabularyWord(String(params.word || ""));
        if (existingWords.some((w) => normalizeVocabularyWord(w.word) === normWord)) {
          return {
            success: false,
            message: `Từ "${String(params.word)}" đã tồn tại trong bộ "${existingSet.title}".`,
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 409,
          };
        }

        const { data: inserted, error } = await supabase
          .from("vocabularies")
          .insert({
            set_id: setId,
            owner_id: userId,
            word: String(params.word || "").trim(),
            meaning: String(params.meaning || "").trim(),
            ipa: (params.ipa as string | null) ?? null,
            part_of_speech: (params.part_of_speech as string | null) ?? null,
            example: (params.example as string | null) ?? null,
            example_translation: (params.example_translation as string | null) ?? null,
            synonyms: Array.isArray(params.synonyms) ? (params.synonyms as string[]) : null,
            antonyms: Array.isArray(params.antonyms) ? (params.antonyms as string[]) : null,
            note: (params.note as string | null) ?? null,
            difficulty: normalizeDbDifficulty(params.difficulty as string | null),
            source: "ai",
          })
          .select("id")
          .single();

        if (error) throw error;
        affectedCount = 1;
        targetIds = inserted?.id ? [inserted.id] : [setId];
        actionUrl = `/u/vocabulary/${setId}`;
        message = `Đã thêm từ "${String(params.word)}" vào bộ "${existingSet.title}".`;
        break;
      }

      case "update_vocabulary_word": {
        const wordId = String(params.wordId || "");
        const updates = (params.updates as Record<string, unknown>) || {};
        const { data: updated, error } = await supabase
          .from("vocabularies")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wordId)
          .eq("owner_id", userId)
          .is("deleted_at", null)
          .select("id, word, set_id")
          .maybeSingle();

        if (error) throw error;
        if (!updated) {
          return {
            success: false,
            message: "Từ vựng không tồn tại hoặc bạn không có quyền chỉnh sửa.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        affectedCount = 1;
        targetIds = [updated.id];
        actionUrl = `/u/vocabulary/${updated.set_id}`;
        message = `Đã cập nhật từ "${updated.word}" thành công.`;
        break;
      }

      case "delete_vocabulary_word": {
        const wordId = String(params.wordId || "");
        const { data: existing, error: fetchErr } = await supabase
          .from("vocabularies")
          .select("id, word, set_id")
          .eq("id", wordId)
          .eq("owner_id", userId)
          .is("deleted_at", null)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!existing) {
          return {
            success: false,
            message: "Từ vựng không tồn tại hoặc đã bị xóa trước đó.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        await VocabularyRepository.softDelete(wordId, userId);
        affectedCount = 1;
        targetIds = [wordId];
        message = `Đã xóa từ "${existing.word}" thành công.`;
        break;
      }

      case "bulk_create_vocabulary_words": {
        const setId = String(params.setId || "");
        const existingSet = await VocabSetRepository.getVocabSetById(setId, userId);
        if (!existingSet || existingSet.deleted_at) {
          return {
            success: false,
            message: "Bộ từ vựng đích không còn tồn tại.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 404,
          };
        }

        const existingWords = await VocabularyRepository.getBySetId(setId, userId);
        const existingSetNorm = new Set(existingWords.map((w) => normalizeVocabularyWord(w.word)));

        const words = Array.isArray(params.words)
          ? (params.words as Array<Record<string, unknown>>)
          : [];
        const rows = words
          .filter((w) => !existingSetNorm.has(normalizeVocabularyWord(String(w.word || ""))))
          .map((w) => ({
            set_id: setId,
            owner_id: userId,
            word: String(w.word || "").trim(),
            meaning: String(w.meaning || "").trim(),
            ipa: (w.ipa as string | null) ?? null,
            part_of_speech: (w.part_of_speech as string | null) ?? null,
            example: (w.example as string | null) ?? null,
            example_translation: (w.example_translation as string | null) ?? null,
            synonyms: Array.isArray(w.synonyms) ? (w.synonyms as string[]) : null,
            antonyms: Array.isArray(w.antonyms) ? (w.antonyms as string[]) : null,
            note: (w.note as string | null) ?? null,
            difficulty: normalizeDbDifficulty(w.difficulty as string | null),
            source: "ai" as const,
          }));

        if (rows.length === 0) {
          return {
            success: false,
            message: `Tất cả các từ đã tồn tại trong bộ "${existingSet.title}".`,
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 409,
          };
        }

        await VocabularyRepository.bulkInsert(rows);
        affectedCount = rows.length;
        targetIds = [setId];
        actionUrl = `/u/vocabulary/${setId}`;
        message = `Đã thêm ${rows.length} từ mới vào bộ "${existingSet.title}" thành công.`;
        break;
      }

      case "bulk_update_vocabulary_words": {
        const items = Array.isArray(params.items)
          ? (params.items as Array<{ wordId: string; updates: Record<string, unknown> }>)
          : [];

        const succeededIds: string[] = [];
        const failedIds: string[] = [];

        for (const item of items) {
          const { data: updated, error } = await supabase
            .from("vocabularies")
            .update({
              ...item.updates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.wordId)
            .eq("owner_id", userId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

          if (error || !updated) {
            failedIds.push(item.wordId);
          } else {
            succeededIds.push(updated.id);
          }
        }

        if (succeededIds.length === 0) {
          return {
            success: false,
            message: "Không thể cập nhật bất kỳ từ vựng nào.",
            action: payload.action,
            actionId: payload.actionId,
            affectedCount: 0,
            targetIds: [],
            statusCode: 400,
          };
        }

        affectedCount = succeededIds.length;
        targetIds = succeededIds;
        message =
          failedIds.length > 0
            ? `Đã cập nhật ${succeededIds.length}/${items.length} từ vựng (${failedIds.length} từ thất bại).`
            : `Đã cập nhật ${succeededIds.length} từ vựng thành công.`;
        break;
      }

      case "save_personal_test": {
        const test = params.test as VocabeeTest;
        const created = await PersonalTestRepository.createPersonalTest(userId, test);
        if (!created) {
          throw new Error("Không thể lưu bài kiểm tra cá nhân.");
        }
        affectedCount = 1;
        targetIds = [created.id];
        actionUrl = `/u/personal-test/${created.id}`;
        message = `Đã lưu bài kiểm tra "${created.title}" (${created.total_words} từ) thành công.`;
        break;
      }
    }

    markConfirmationConsumed(payload.actionId, payload.expiresAt);

    await recordAiActionAudit({
      actionId: payload.actionId,
      userId,
      actionType: payload.action,
      targetIds,
      affectedCount,
      status: "executed",
      summary: message,
    });

    revalidatePath("/u");
    revalidatePath("/u/vocabulary");
    revalidatePath("/u/vocabulary-management");
    revalidatePath("/u/review");
    revalidatePath("/u/statistics");
    revalidatePath("/u/personal-test");

    return {
      success: true,
      message,
      action: payload.action,
      actionId: payload.actionId,
      affectedCount,
      targetIds,
      actionUrl,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Không thể thực thi thao tác trên cơ sở dữ liệu.";
    await recordAiActionAudit({
      actionId: payload.actionId,
      userId,
      actionType: payload.action,
      targetIds: [],
      affectedCount: 0,
      status: "failed",
      summary: `Failed ${payload.action}`,
      errorMessage: errMsg,
    });

    return {
      success: false,
      message: errMsg,
      action: payload.action,
      actionId: payload.actionId,
      affectedCount: 0,
      targetIds: [],
      statusCode: 500,
    };
  }
}

export async function cancelPendingAgentAction(
  userId: string,
  input: {
    token: string;
    action: AgentActionType;
    actionId: string;
  }
): Promise<{ success: boolean; message: string }> {
  const verification = verifyConfirmationToken(
    input.token,
    input.action,
    input.actionId,
    userId
  );

  if (verification.valid) {
    markConfirmationConsumed(verification.payload.actionId, verification.payload.expiresAt);
    await recordAiActionAudit({
      actionId: verification.payload.actionId,
      userId,
      actionType: verification.payload.action,
      targetIds: [],
      affectedCount: 0,
      status: "cancelled",
      summary: `Cancelled ${verification.payload.action}`,
    });
  }

  return { success: true, message: "Đã hủy thao tác. Dữ liệu của bạn được giữ nguyên." };
}
