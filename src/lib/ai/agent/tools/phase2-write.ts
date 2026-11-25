// src/lib/ai/agent/tools/phase2-write.ts
import { z } from "zod";
import { normalizeVocabularyWord } from "@/lib/validation/vocabulary-duplicates";
import { createPendingConfirmation } from "../confirmation";
import { recordAiActionAudit } from "../audit";
import {
  fetchAllUserActiveWords,
  normalizeDbDifficulty,
  resolveOwnedSet,
  type ToolExecutionOutput,
} from "./shared";

const wordInputSchema = z.object({
  word: z.string().trim().min(1).max(120),
  meaning: z.string().trim().min(1).max(500),
  ipa: z.string().trim().max(120).optional().nullable(),
  part_of_speech: z.string().trim().max(60).optional().nullable(),
  example: z.string().trim().max(600).optional().nullable(),
  example_translation: z.string().trim().max(600).optional().nullable(),
  synonyms: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
  antonyms: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
  note: z.string().trim().max(600).optional().nullable(),
  difficulty: z.string().trim().max(30).optional().nullable(),
});

function dedupeWordInputs(items: Array<z.infer<typeof wordInputSchema>>) {
  const seen = new Set<string>();
  const unique: Array<z.infer<typeof wordInputSchema>> = [];
  const duplicates: string[] = [];

  for (const item of items) {
    const key = normalizeVocabularyWord(item.word);
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.push(item.word);
      continue;
    }
    seen.add(key);
    unique.push({
      ...item,
      difficulty: normalizeDbDifficulty(item.difficulty),
    });
  }

  return { unique, duplicates };
}

export async function handlePrepareCreateVocabularySet(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500).optional().nullable(),
      source_language: z.string().trim().min(1).max(20).default("en"),
      target_language: z.string().trim().min(1).max(20).default("vi"),
      visibility: z.enum(["private", "unlisted", "public"]).default("private"),
      words: z.array(wordInputSchema).max(50).optional().default([]),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Thông tin tạo bộ từ không hợp lệ.",
      error: parsed.error.issues[0]?.message || "Tham số không hợp lệ.",
    };
  }

  const { unique: dedupedWords, duplicates } = dedupeWordInputs(parsed.data.words);
  const wordCount = dedupedWords.length;

  const confirmation = createPendingConfirmation({
    userId,
    action: "create_vocabulary_set",
    title: "Xác nhận tạo bộ từ vựng mới",
    description: `Tạo bộ từ "${parsed.data.title}"${wordCount > 0 ? ` kèm ${wordCount} từ vựng` : ""}.`,
    targetName: parsed.data.title,
    affectedCount: 1 + wordCount,
    affectedSummary:
      wordCount > 0
        ? `1 bộ từ mới và ${wordCount} từ vựng${duplicates.length > 0 ? ` (đã lọc ${duplicates.length} từ trùng)` : ""}`
        : "1 bộ từ vựng mới (chưa có từ vựng)",
    consequences: [
      `Bộ từ sẽ được tạo với chế độ hiển thị: ${parsed.data.visibility}.`,
      wordCount > 0
        ? `${wordCount} từ vựng sẽ được thêm vào bộ từ này.`
        : "Bạn có thể thêm từ vựng vào bộ này sau.",
    ],
    previewItems: dedupedWords.slice(0, 6).map((w) => ({
      label: w.word,
      detail: w.meaning,
    })),
    params: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      source_language: parsed.data.source_language,
      target_language: parsed.data.target_language,
      visibility: parsed.data.visibility,
      words: dedupedWords,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "create_vocabulary_set",
    targetIds: [],
    affectedCount: 1 + wordCount,
    status: "pending",
    summary: `Pending create set "${parsed.data.title}" (${wordCount} words)`,
  });

  return {
    data: {
      requiresConfirmation: true,
      actionId: confirmation.actionId,
      preview: {
        title: parsed.data.title,
        wordCount,
        duplicatesSkipped: duplicates,
      },
    },
    summary: `Đã chuẩn bị bản xem trước tạo bộ từ "${parsed.data.title}". Chờ người dùng xác nhận trên giao diện.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareUpdateVocabularySet(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
      current_title: z.string().trim().optional(),
      title: z.string().trim().min(1).max(100).optional(),
      description: z.string().trim().max(500).optional().nullable(),
      visibility: z.enum(["private", "unlisted", "public"]).optional(),
      source_language: z.string().trim().min(1).max(20).optional(),
      target_language: z.string().trim().min(1).max(20).optional(),
    })
    .refine((d) => Boolean(d.set_id || d.current_title), {
      message: "Cần cung cấp set_id hoặc current_title.",
    })
    .refine(
      (d) =>
        d.title !== undefined ||
        d.description !== undefined ||
        d.visibility !== undefined ||
        d.source_language !== undefined ||
        d.target_language !== undefined,
      { message: "Cần ít nhất một trường cần cập nhật." }
    )
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Thông tin cập nhật bộ từ không hợp lệ.",
      error: parsed.error.issues[0]?.message,
    };
  }

  const { set, ambiguousMatches } = await resolveOwnedSet(userId, {
    setId: parsed.data.set_id,
    setTitle: parsed.data.current_title,
  });

  if (ambiguousMatches && ambiguousMatches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: ambiguousMatches.map((m) => ({ id: m.id, title: m.title })),
      },
      summary: `Có ${ambiguousMatches.length} bộ từ trùng khớp. Hãy hỏi người dùng chọn chính xác.`,
    };
  }

  if (!set) {
    return {
      data: null,
      summary: "Không tìm thấy bộ từ vựng thuộc quyền sở hữu của bạn.",
      error: "Không tìm thấy bộ từ vựng.",
    };
  }

  const updates: Record<string, unknown> = {};
  const changesPreview: Array<{ label: string; detail?: string }> = [];

  if (parsed.data.title !== undefined && parsed.data.title !== set.title) {
    updates.title = parsed.data.title;
    changesPreview.push({ label: "Tên bộ từ", detail: `${set.title} → ${parsed.data.title}` });
  }
  if (parsed.data.description !== undefined) {
    updates.description = parsed.data.description;
    changesPreview.push({ label: "Mô tả", detail: parsed.data.description || "(Trống)" });
  }
  if (parsed.data.visibility !== undefined && parsed.data.visibility !== set.visibility) {
    updates.visibility = parsed.data.visibility;
    changesPreview.push({
      label: "Hiển thị",
      detail: `${set.visibility || "private"} → ${parsed.data.visibility}`,
    });
  }
  if (parsed.data.source_language !== undefined) {
    updates.source_language = parsed.data.source_language;
  }
  if (parsed.data.target_language !== undefined) {
    updates.target_language = parsed.data.target_language;
  }

  if (Object.keys(updates).length === 0) {
    return {
      data: { noChanges: true, setId: set.id },
      summary: `Bộ từ "${set.title}" đã có đúng các thông tin này, không cần thay đổi.`,
    };
  }

  const confirmation = createPendingConfirmation({
    userId,
    action: "update_vocabulary_set",
    title: "Xác nhận cập nhật bộ từ vựng",
    description: `Cập nhật thông tin cho bộ từ "${set.title}".`,
    targetName: set.title,
    affectedCount: 1,
    affectedSummary: "1 bộ từ vựng",
    consequences: ["Thông tin metadata của bộ từ sẽ được cập nhật trên Vocabee."],
    previewItems: changesPreview,
    params: {
      setId: set.id,
      updates,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "update_vocabulary_set",
    targetIds: [set.id],
    affectedCount: 1,
    status: "pending",
    summary: `Pending update set ${set.id}`,
  });

  return {
    data: { requiresConfirmation: true, actionId: confirmation.actionId, setId: set.id },
    summary: `Đã chuẩn bị cập nhật bộ từ "${set.title}". Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareDeleteVocabularySet(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
      set_title: z.string().trim().optional(),
    })
    .refine((d) => Boolean(d.set_id || d.set_title), {
      message: "Cần cung cấp set_id hoặc set_title.",
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.issues[0]?.message };
  }

  const { set, ambiguousMatches } = await resolveOwnedSet(userId, {
    setId: parsed.data.set_id,
    setTitle: parsed.data.set_title,
  });

  if (ambiguousMatches && ambiguousMatches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: ambiguousMatches.map((m) => ({ id: m.id, title: m.title })),
      },
      summary: `Có ${ambiguousMatches.length} bộ từ trùng tên. Hãy chọn chính xác bộ từ muốn xóa.`,
    };
  }

  if (!set) {
    return {
      data: null,
      summary: "Không tìm thấy bộ từ vựng thuộc tài khoản của bạn.",
      error: "Không tìm thấy bộ từ vựng.",
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const wordsInSet = allWords.filter((w) => w.set_id === set.id);

  const confirmation = createPendingConfirmation({
    userId,
    action: "delete_vocabulary_set",
    title: "Xác nhận xóa bộ từ vựng",
    description: `Xóa vĩnh viễn bộ từ "${set.title}" và toàn bộ từ vựng bên trong.`,
    targetName: set.title,
    affectedCount: 1 + wordsInSet.length,
    affectedSummary: `Bộ từ "${set.title}" (${wordsInSet.length} từ vựng)`,
    consequences: [
      `Xóa bộ từ "${set.title}" cùng ${wordsInSet.length} từ vựng và dữ liệu ôn tập liên quan.`,
      "Hành động này không thể hoàn tác.",
      "Các bộ từ vựng khác của bạn vẫn được giữ nguyên.",
    ],
    previewItems: wordsInSet.slice(0, 5).map((w) => ({
      label: w.word,
      detail: w.meaning,
    })),
    params: {
      setId: set.id,
      setTitle: set.title,
      wordCount: wordsInSet.length,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "delete_vocabulary_set",
    targetIds: [set.id],
    affectedCount: 1 + wordsInSet.length,
    status: "pending",
    summary: `Pending delete set "${set.title}" (${wordsInSet.length} words)`,
  });

  return {
    data: {
      requiresConfirmation: true,
      actionId: confirmation.actionId,
      setId: set.id,
      setTitle: set.title,
      wordCount: wordsInSet.length,
    },
    summary: `Đã tìm thấy bộ từ "${set.title}" gồm ${wordsInSet.length} từ. Chờ người dùng xác nhận xóa.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareCreateVocabularyWord(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
      set_title: z.string().trim().optional(),
      word: z.string().trim().min(1).max(120),
      meaning: z.string().trim().min(1).max(500),
      ipa: z.string().trim().max(120).optional().nullable(),
      part_of_speech: z.string().trim().max(60).optional().nullable(),
      example: z.string().trim().max(600).optional().nullable(),
      example_translation: z.string().trim().max(600).optional().nullable(),
      synonyms: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
      antonyms: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
      note: z.string().trim().max(600).optional().nullable(),
      difficulty: z.string().trim().max(30).optional().nullable(),
    })
    .refine((d) => Boolean(d.set_id || d.set_title), {
      message: "Cần chỉ định set_id hoặc set_title để thêm từ.",
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Dữ liệu từ vựng không hợp lệ.",
      error: parsed.error.issues[0]?.message,
    };
  }

  const { set, ambiguousMatches } = await resolveOwnedSet(userId, {
    setId: parsed.data.set_id,
    setTitle: parsed.data.set_title,
  });

  if (ambiguousMatches && ambiguousMatches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: ambiguousMatches.map((m) => ({ id: m.id, title: m.title })),
      },
      summary: `Có ${ambiguousMatches.length} bộ từ trùng tên. Hãy chọn chính xác bộ từ đích.`,
    };
  }

  if (!set) {
    return {
      data: null,
      summary: "Không tìm thấy bộ từ vựng đích thuộc tài khoản của bạn.",
      error: "Không tìm thấy bộ từ vựng.",
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const normTarget = normalizeVocabularyWord(parsed.data.word);
  const existingInTargetSet = allWords.find(
    (w) => w.set_id === set.id && normalizeVocabularyWord(w.word) === normTarget
  );

  if (existingInTargetSet) {
    return {
      data: {
        duplicateDetected: true,
        existingWord: {
          id: existingInTargetSet.id,
          word: existingInTargetSet.word,
          meaning: existingInTargetSet.meaning,
          setId: set.id,
          setTitle: set.title,
        },
      },
      summary: `Từ "${existingInTargetSet.word}" đã tồn tại trong bộ "${set.title}" (nghĩa: "${existingInTargetSet.meaning}"). Không tạo bản sao trùng lặp.`,
    };
  }

  const otherSetCopies = allWords
    .filter((w) => w.set_id !== set.id && normalizeVocabularyWord(w.word) === normTarget)
    .map((w) => w.setTitle);

  const normalizedDiff = normalizeDbDifficulty(parsed.data.difficulty);

  const confirmation = createPendingConfirmation({
    userId,
    action: "create_vocabulary_word",
    title: "Xác nhận thêm từ vựng mới",
    description: `Thêm từ "${parsed.data.word}" vào bộ "${set.title}".`,
    targetName: `${parsed.data.word} → ${set.title}`,
    affectedCount: 1,
    affectedSummary: `1 từ vựng mới trong bộ "${set.title}"`,
    consequences: [
      `Nghĩa: ${parsed.data.meaning}`,
      ...(otherSetCopies.length > 0
        ? [`Lưu ý: từ này đã có ở bộ khác (${otherSetCopies.join(", ")}), nhưng chưa có trong "${set.title}".`]
        : []),
    ],
    previewItems: [
      {
        label: `${parsed.data.word}${parsed.data.ipa ? ` ${parsed.data.ipa}` : ""}`,
        detail: parsed.data.meaning,
      },
    ],
    params: {
      setId: set.id,
      word: parsed.data.word,
      meaning: parsed.data.meaning,
      ipa: parsed.data.ipa || null,
      part_of_speech: parsed.data.part_of_speech || null,
      example: parsed.data.example || null,
      example_translation: parsed.data.example_translation || null,
      synonyms: parsed.data.synonyms ?? null,
      antonyms: parsed.data.antonyms ?? null,
      note: parsed.data.note || null,
      difficulty: normalizedDiff,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "create_vocabulary_word",
    targetIds: [set.id],
    affectedCount: 1,
    status: "pending",
    summary: `Pending create word "${parsed.data.word}" in set ${set.id}`,
  });

  return {
    data: { requiresConfirmation: true, actionId: confirmation.actionId, setId: set.id },
    summary: `Đã chuẩn bị thêm từ "${parsed.data.word}" vào bộ "${set.title}". Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareUpdateVocabularyWord(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      word_id: z.string().trim().optional(),
      word: z.string().trim().optional(),
      set_id: z.string().trim().optional(),
      updates: z.object({
        word: z.string().trim().min(1).max(120).optional(),
        meaning: z.string().trim().min(1).max(500).optional(),
        ipa: z.string().trim().max(120).nullable().optional(),
        part_of_speech: z.string().trim().max(60).nullable().optional(),
        example: z.string().trim().max(600).nullable().optional(),
        example_translation: z.string().trim().max(600).nullable().optional(),
        synonyms: z.array(z.string().trim().min(1).max(80)).max(10).nullable().optional(),
        antonyms: z.array(z.string().trim().min(1).max(80)).max(10).nullable().optional(),
        note: z.string().trim().max(600).nullable().optional(),
        difficulty: z.string().trim().max(30).nullable().optional(),
        is_starred: z.boolean().nullable().optional(),
      }),
    })
    .refine((d) => Boolean(d.word_id || d.word), {
      message: "Cần cung cấp word_id hoặc word.",
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Thông tin cập nhật từ vựng không hợp lệ.",
      error: parsed.error.issues[0]?.message,
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const matches = parsed.data.word_id
    ? allWords.filter((w) => w.id === parsed.data.word_id)
    : allWords.filter(
        (w) =>
          normalizeVocabularyWord(w.word) === normalizeVocabularyWord(parsed.data.word!) &&
          (!parsed.data.set_id || w.set_id === parsed.data.set_id)
      );

  if (matches.length === 0) {
    return {
      data: null,
      summary: "Không tìm thấy từ vựng thuộc quyền sở hữu của bạn.",
      error: "Không tìm thấy từ vựng.",
    };
  }

  if (matches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: matches.map((m) => ({
          id: m.id,
          word: m.word,
          setId: m.set_id,
          setTitle: m.setTitle,
          meaning: m.meaning,
        })),
      },
      summary: `Từ "${matches[0].word}" xuất hiện ở ${matches.length} bộ từ. Hãy chỉ định rõ word_id hoặc bộ từ muốn sửa.`,
    };
  }

  const target = matches[0];
  const cleanUpdates: Record<string, unknown> = { ...parsed.data.updates };
  if (parsed.data.updates.difficulty !== undefined) {
    cleanUpdates.difficulty = normalizeDbDifficulty(parsed.data.updates.difficulty);
  }

  const previewItems = Object.entries(cleanUpdates).map(([k, v]) => ({
    label: k,
    detail: Array.isArray(v) ? v.join(", ") : String(v ?? "(Trống)"),
  }));

  if (previewItems.length === 0) {
    return {
      data: { noChanges: true },
      summary: "Không có trường nào được chỉ định để cập nhật.",
    };
  }

  const confirmation = createPendingConfirmation({
    userId,
    action: "update_vocabulary_word",
    title: "Xác nhận cập nhật từ vựng",
    description: `Cập nhật từ "${target.word}" trong bộ "${target.setTitle}".`,
    targetName: `${target.word} (${target.setTitle})`,
    affectedCount: 1,
    affectedSummary: `1 từ vựng trong bộ "${target.setTitle}"`,
    consequences: ["Dữ liệu từ vựng sẽ được cập nhật trên Vocabee."],
    previewItems,
    params: {
      wordId: target.id,
      updates: cleanUpdates,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "update_vocabulary_word",
    targetIds: [target.id],
    affectedCount: 1,
    status: "pending",
    summary: `Pending update word "${target.word}" (${target.id})`,
  });

  return {
    data: { requiresConfirmation: true, actionId: confirmation.actionId, wordId: target.id },
    summary: `Đã chuẩn bị cập nhật từ "${target.word}". Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareDeleteVocabularyWord(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      word_id: z.string().trim().optional(),
      word: z.string().trim().optional(),
      set_id: z.string().trim().optional(),
    })
    .refine((d) => Boolean(d.word_id || d.word), {
      message: "Cần cung cấp word_id hoặc word.",
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.issues[0]?.message };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const matches = parsed.data.word_id
    ? allWords.filter((w) => w.id === parsed.data.word_id)
    : allWords.filter(
        (w) =>
          normalizeVocabularyWord(w.word) === normalizeVocabularyWord(parsed.data.word!) &&
          (!parsed.data.set_id || w.set_id === parsed.data.set_id)
      );

  if (matches.length === 0) {
    return {
      data: null,
      summary: "Không tìm thấy từ vựng cần xóa trong kho từ của bạn.",
      error: "Không tìm thấy từ vựng.",
    };
  }

  if (matches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: matches.map((m) => ({
          id: m.id,
          word: m.word,
          setId: m.set_id,
          setTitle: m.setTitle,
        })),
      },
      summary: `Từ "${matches[0].word}" có mặt trong ${matches.length} bộ từ. Hãy xác định rõ từ trong bộ nào cần xóa.`,
    };
  }

  const target = matches[0];
  const otherSetCopies = allWords.filter(
    (w) => w.id !== target.id && normalizeVocabularyWord(w.word) === normalizeVocabularyWord(target.word)
  );

  const confirmation = createPendingConfirmation({
    userId,
    action: "delete_vocabulary_word",
    title: "Xác nhận xóa từ vựng",
    description: `Xóa từ "${target.word}" khỏi bộ "${target.setTitle}".`,
    targetName: `${target.word} (${target.setTitle})`,
    affectedCount: 1,
    affectedSummary: `1 từ vựng trong bộ "${target.setTitle}"`,
    consequences: [
      `Từ "${target.word}" (${target.meaning}) sẽ bị xóa khỏi bộ "${target.setTitle}".`,
      ...(otherSetCopies.length > 0
        ? [`Các bản sao của từ này ở ${otherSetCopies.length} bộ từ khác vẫn được giữ nguyên.`]
        : []),
    ],
    previewItems: [{ label: target.word, detail: target.meaning }],
    params: {
      wordId: target.id,
      word: target.word,
      setId: target.set_id,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "delete_vocabulary_word",
    targetIds: [target.id],
    affectedCount: 1,
    status: "pending",
    summary: `Pending delete word "${target.word}" (${target.id})`,
  });

  return {
    data: { requiresConfirmation: true, actionId: confirmation.actionId, wordId: target.id },
    summary: `Đã chuẩn bị xóa từ "${target.word}" khỏi bộ "${target.setTitle}". Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareBulkCreateVocabularyWords(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
      set_title: z.string().trim().optional(),
      words: z.array(wordInputSchema).min(1).max(50),
    })
    .refine((d) => Boolean(d.set_id || d.set_title), {
      message: "Cần chỉ định set_id hoặc set_title.",
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Danh sách từ vựng không hợp lệ.",
      error: parsed.error.issues[0]?.message,
    };
  }

  const { set, ambiguousMatches } = await resolveOwnedSet(userId, {
    setId: parsed.data.set_id,
    setTitle: parsed.data.set_title,
  });

  if (ambiguousMatches && ambiguousMatches.length > 1) {
    return {
      data: {
        ambiguous: true,
        matches: ambiguousMatches.map((m) => ({ id: m.id, title: m.title })),
      },
      summary: `Có ${ambiguousMatches.length} bộ từ trùng khớp. Hãy chọn chính xác bộ từ đích.`,
    };
  }

  if (!set) {
    return {
      data: null,
      summary: "Không tìm thấy bộ từ vựng đích.",
      error: "Không tìm thấy bộ từ vựng.",
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const existingInSet = new Set(
    allWords
      .filter((w) => w.set_id === set.id)
      .map((w) => normalizeVocabularyWord(w.word))
  );

  const { unique: batchUnique, duplicates: batchDuplicates } = dedupeWordInputs(parsed.data.words);
  const toInsert = batchUnique.filter((w) => !existingInSet.has(normalizeVocabularyWord(w.word)));
  const skippedExisting = batchUnique
    .filter((w) => existingInSet.has(normalizeVocabularyWord(w.word)))
    .map((w) => w.word);

  if (toInsert.length === 0) {
    return {
      data: {
        duplicateDetected: true,
        skippedExisting,
        batchDuplicates,
      },
      summary: `Tất cả ${parsed.data.words.length} từ đều đã có trong bộ "${set.title}". Không có từ mới nào cần thêm.`,
    };
  }

  const confirmation = createPendingConfirmation({
    userId,
    action: "bulk_create_vocabulary_words",
    title: "Xác nhận thêm hàng loạt từ vựng",
    description: `Thêm ${toInsert.length} từ vựng mới vào bộ "${set.title}".`,
    targetName: set.title,
    affectedCount: toInsert.length,
    affectedSummary: `${toInsert.length} từ mới sẽ được thêm vào "${set.title}"`,
    consequences: [
      `Thêm ${toInsert.length} từ vựng hợp lệ.`,
      ...(skippedExisting.length > 0 || batchDuplicates.length > 0
        ? [`Tự động bỏ qua ${skippedExisting.length + batchDuplicates.length} từ bị trùng lặp.`]
        : []),
    ],
    previewItems: toInsert.slice(0, 6).map((w) => ({ label: w.word, detail: w.meaning })),
    params: {
      setId: set.id,
      words: toInsert,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "bulk_create_vocabulary_words",
    targetIds: [set.id],
    affectedCount: toInsert.length,
    status: "pending",
    summary: `Pending bulk add ${toInsert.length} words into ${set.id}`,
  });

  return {
    data: {
      requiresConfirmation: true,
      actionId: confirmation.actionId,
      setId: set.id,
      addCount: toInsert.length,
      skippedExisting,
      batchDuplicates,
    },
    summary: `Đã chuẩn bị thêm ${toInsert.length} từ mới vào bộ "${set.title}". Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}

export async function handlePrepareBulkUpdateVocabularyWords(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      items: z
        .array(
          z.object({
            word_id: z.string().trim().min(1),
            meaning: z.string().trim().min(1).max(500).optional(),
            ipa: z.string().trim().max(120).nullable().optional(),
            part_of_speech: z.string().trim().max(60).nullable().optional(),
            example: z.string().trim().max(600).nullable().optional(),
            example_translation: z.string().trim().max(600).nullable().optional(),
            synonyms: z.array(z.string().trim().min(1).max(80)).max(10).nullable().optional(),
            note: z.string().trim().max(600).nullable().optional(),
            difficulty: z.string().trim().max(30).nullable().optional(),
            is_starred: z.boolean().nullable().optional(),
          })
        )
        .min(1)
        .max(30),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return {
      data: null,
      summary: "Dữ liệu cập nhật hàng loạt không hợp lệ.",
      error: parsed.error.issues[0]?.message,
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const ownedMap = new Map(allWords.map((w) => [w.id, w]));

  const validItems: Array<{ wordId: string; word: string; updates: Record<string, unknown> }> = [];
  const unauthorizedOrMissing: string[] = [];

  for (const item of parsed.data.items) {
    const existing = ownedMap.get(item.word_id);
    if (!existing) {
      unauthorizedOrMissing.push(item.word_id);
      continue;
    }

    const { word_id: _id, ...rest } = item;
    void _id;
    const updates: Record<string, unknown> = { ...rest };
    if (item.difficulty !== undefined) {
      updates.difficulty = normalizeDbDifficulty(item.difficulty);
    }
    if (Object.keys(updates).length > 0) {
      validItems.push({ wordId: existing.id, word: existing.word, updates });
    }
  }

  if (validItems.length === 0) {
    return {
      data: null,
      summary: "Không có từ vựng hợp lệ nào thuộc quyền sở hữu của bạn để cập nhật.",
      error: "Không tìm thấy từ vựng hợp lệ.",
    };
  }

  const confirmation = createPendingConfirmation({
    userId,
    action: "bulk_update_vocabulary_words",
    title: "Xác nhận cập nhật hàng loạt từ vựng",
    description: `Cập nhật ${validItems.length} từ vựng.`,
    targetName: `${validItems.length} từ vựng`,
    affectedCount: validItems.length,
    affectedSummary: `${validItems.length} từ vựng sẽ được cập nhật`,
    consequences: [
      `Cập nhật ${validItems.length} từ vựng thuộc tài khoản của bạn.`,
      ...(unauthorizedOrMissing.length > 0
        ? [`Bỏ qua ${unauthorizedOrMissing.length} ID không hợp lệ hoặc không thuộc quyền sở hữu.`]
        : []),
    ],
    previewItems: validItems.slice(0, 6).map((v) => ({
      label: v.word,
      detail: Object.keys(v.updates).join(", "),
    })),
    params: {
      items: validItems.map((v) => ({ wordId: v.wordId, updates: v.updates })),
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "bulk_update_vocabulary_words",
    targetIds: validItems.map((v) => v.wordId),
    affectedCount: validItems.length,
    status: "pending",
    summary: `Pending bulk update ${validItems.length} words`,
  });

  return {
    data: {
      requiresConfirmation: true,
      actionId: confirmation.actionId,
      validCount: validItems.length,
      skippedIds: unauthorizedOrMissing,
    },
    summary: `Đã chuẩn bị cập nhật ${validItems.length} từ vựng. Chờ người dùng xác nhận.`,
    confirmations: [confirmation],
  };
}
