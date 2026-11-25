// src/lib/ai/agent/tools/phase1-read.ts
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { VocabSetSummaryService } from "@/lib/statistics/vocab-set-summary.service";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { StudySessionRepository } from "@/repositories/study-session.repository";
import { summarizeSrsForecast } from "@/lib/srs/upcoming-reviews";
import { parseCefrRank } from "@/lib/learning/mastery-selection";
import {
  countUniqueWords,
  fetchAllUserActiveSets,
  fetchAllUserActiveWords,
  resolveOwnedSet,
  serializeWordCompact,
  type ToolExecutionOutput,
} from "./shared";

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function handleListVocabularySets(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      sort: z.enum(["updated_desc", "title_asc", "words_desc", "mastery_desc"]).optional().default("updated_desc"),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const { page, limit, sort } = parsed.data;
  const [sets, summaries] = await Promise.all([
    fetchAllUserActiveSets(userId),
    VocabSetSummaryService.getUserVocabSetSummaries(userId),
  ]);

  const enriched = sets.map((s) => {
    const sum = summaries[s.id];
    const totalWords = sum?.totalWords ?? 0;
    const masteredWords = sum?.masteredWords ?? 0;
    const masteryRate = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      sourceLanguage: s.source_language,
      targetLanguage: s.target_language,
      visibility: s.visibility,
      totalWords,
      masteredWords,
      learningWords: sum?.learningWords ?? 0,
      newWords: sum?.newWords ?? 0,
      masteryRatePercent: masteryRate,
      lastStudiedAt: sum?.lastStudiedAt ?? s.last_studied_at,
      updatedAt: s.updated_at,
    };
  });

  if (sort === "title_asc") enriched.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "words_desc") enriched.sort((a, b) => b.totalWords - a.totalWords);
  else if (sort === "mastery_desc") enriched.sort((a, b) => b.masteryRatePercent - a.masteryRatePercent);

  const totalSets = enriched.length;
  const offset = (page - 1) * limit;
  const items = enriched.slice(offset, offset + limit);

  return {
    data: {
      scope: "account_active_sets",
      totalSets,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalSets / limit)),
      returnedCount: items.length,
      sets: items,
    },
    summary: `Tìm thấy ${totalSets} bộ từ vựng (hiển thị ${items.length} bộ ở trang ${page}).`,
    cards: items.length > 0
      ? [
          {
            id: `sets-${Date.now()}`,
            kind: "vocab_sets",
            title: `Danh sách bộ từ vựng (${totalSets})`,
            items: items.slice(0, 8).map((s) => ({
              id: s.id,
              title: s.title,
              subtitle: `${s.totalWords} từ · Thành thạo ${s.masteryRatePercent}%`,
              badge: s.visibility || "private",
            })),
          },
        ]
      : undefined,
  };
}

export async function handleGetVocabularySet(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().min(1).optional(),
      set_title: z.string().trim().min(1).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(25),
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
      summary: `Có ${ambiguousMatches.length} bộ từ trùng khớp tên. Hãy chọn chính xác bộ từ.`,
    };
  }

  if (!set) {
    return {
      data: null,
      summary: "Không tìm thấy bộ từ vựng thuộc tài khoản của bạn.",
      error: "Không tìm thấy bộ từ vựng yêu cầu.",
    };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const setWords = allWords.filter((w) => w.set_id === set.id);
  const uniqueInSet = countUniqueWords(setWords);

  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const pagedWords = setWords.slice(offset, offset + parsed.data.limit).map(serializeWordCompact);

  const masteredCount = setWords.filter((w) => w.srsLevel >= 5 || w.masteryGroup === "mastered").length;
  const learnedCount = setWords.filter((w) => w.srsLevel >= 2).length;

  return {
    data: {
      scope: "single_set",
      set: {
        id: set.id,
        title: set.title,
        description: set.description,
        sourceLanguage: set.source_language,
        targetLanguage: set.target_language,
        visibility: set.visibility,
        source: set.source,
        lastStudiedAt: set.last_studied_at,
        createdAt: set.created_at,
        updatedAt: set.updated_at,
      },
      aggregationMetadata: {
        totalWordsInSet: setWords.length,
        uniqueWordsInSet: uniqueInSet,
        learnedOrAboveCount: learnedCount,
        masteredLv5Count: masteredCount,
        page: parsed.data.page,
        limit: parsed.data.limit,
        returnedWordsCount: pagedWords.length,
      },
      words: pagedWords,
    },
    summary: `Bộ từ "${set.title}" có ${setWords.length} từ (${learnedCount} đã học/ôn tập).`,
  };
}

export async function handleSearchVocabularySets(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      query: z.string().trim().min(1),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Từ khóa tìm kiếm không hợp lệ.", error: parsed.error.message };
  }

  const q = parsed.data.query.toLowerCase();
  const [sets, summaries] = await Promise.all([
    fetchAllUserActiveSets(userId),
    VocabSetSummaryService.getUserVocabSetSummaries(userId),
  ]);

  const matched = sets
    .filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    )
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      totalWords: summaries[s.id]?.totalWords ?? 0,
      masteredWords: summaries[s.id]?.masteredWords ?? 0,
      visibility: s.visibility,
      updatedAt: s.updated_at,
    }));

  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const paged = matched.slice(offset, offset + parsed.data.limit);

  return {
    data: {
      scope: "search_sets",
      query: parsed.data.query,
      totalMatches: matched.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      sets: paged,
    },
    summary: `Tìm thấy ${matched.length} bộ từ khớp "${parsed.data.query}".`,
  };
}

export async function handleCountVocabularySets(userId: string): Promise<ToolExecutionOutput> {
  const sets = await fetchAllUserActiveSets(userId);
  return {
    data: {
      scope: "account_active_sets",
      totalSets: sets.length,
    },
    summary: `Bạn hiện có ${sets.length} bộ từ vựng đang hoạt động.`,
  };
}

export async function handleListVocabularyWords(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      set_id: z.string().trim().optional(),
      difficulty: z.string().trim().optional(),
      part_of_speech: z.string().trim().optional(),
      starred_only: z.boolean().optional(),
      mastery_group: z.enum(["new", "learning", "learned", "mastered"]).optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số lọc từ vựng không hợp lệ.", error: parsed.error.message };
  }

  let words = await fetchAllUserActiveWords(userId);

  if (parsed.data.set_id) {
    words = words.filter((w) => w.set_id === parsed.data.set_id);
  }
  if (parsed.data.difficulty) {
    const targetRank = parseCefrRank(parsed.data.difficulty);
    const diffLower = parsed.data.difficulty.toLowerCase();
    words = words.filter(
      (w) =>
        (w.difficulty || "").toLowerCase() === diffLower ||
        parseCefrRank(w.difficulty) === targetRank
    );
  }
  if (parsed.data.part_of_speech) {
    const posLower = parsed.data.part_of_speech.toLowerCase();
    words = words.filter((w) => (w.part_of_speech || "").toLowerCase().includes(posLower));
  }
  if (parsed.data.starred_only) {
    words = words.filter((w) => Boolean(w.is_starred));
  }
  if (parsed.data.mastery_group) {
    words = words.filter((w) => w.masteryGroup === parsed.data.mastery_group);
  }

  const totalMatches = words.length;
  const uniqueMatches = countUniqueWords(words);
  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const paged = words.slice(offset, offset + parsed.data.limit).map(serializeWordCompact);

  return {
    data: {
      scope: parsed.data.set_id ? "filtered_single_set" : "filtered_account_wide",
      aggregationMetadata: {
        totalMatchingRecords: totalMatches,
        uniqueMatchingWords: uniqueMatches,
        page: parsed.data.page,
        limit: parsed.data.limit,
        returnedCount: paged.length,
      },
      words: paged,
    },
    summary: `Có ${totalMatches} bản ghi từ vựng phù hợp (${uniqueMatches} từ duy nhất, hiển thị ${paged.length} từ).`,
    cards: paged.length > 0
      ? [
          {
            id: `words-${Date.now()}`,
            kind: "word_list",
            title: `Từ vựng (${totalMatches})`,
            items: paged.slice(0, 8).map((w) => ({
              id: w.id,
              title: w.word,
              subtitle: w.meaning,
              badge: w.srsLevel,
              detail: w.setTitle,
            })),
          },
        ]
      : undefined,
  };
}

export async function handleGetVocabularyWord(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      word_id: z.string().trim().min(1).optional(),
      word: z.string().trim().min(1).optional(),
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
        (w) => w.word.trim().toLowerCase() === parsed.data.word!.trim().toLowerCase()
      );

  if (matches.length === 0) {
    return {
      data: { found: false, matches: [] },
      summary: "Không tìm thấy từ vựng này trong kho từ của bạn.",
    };
  }

  return {
    data: {
      found: true,
      occurrenceCountAcrossSets: matches.length,
      records: matches.map(serializeWordCompact),
    },
    summary: `Tìm thấy ${matches.length} bản ghi của từ "${matches[0].word}".`,
  };
}

export async function handleSearchVocabularyWords(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      query: z.string().trim().min(1),
      set_id: z.string().trim().optional(),
      difficulty: z.string().trim().optional(),
      part_of_speech: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số tìm kiếm không hợp lệ.", error: parsed.error.message };
  }

  const q = parsed.data.query.toLowerCase();
  let words = await fetchAllUserActiveWords(userId);

  if (parsed.data.set_id) {
    words = words.filter((w) => w.set_id === parsed.data.set_id);
  }
  if (parsed.data.difficulty) {
    const dLower = parsed.data.difficulty.toLowerCase();
    words = words.filter((w) => (w.difficulty || "").toLowerCase() === dLower);
  }
  if (parsed.data.part_of_speech) {
    const pLower = parsed.data.part_of_speech.toLowerCase();
    words = words.filter((w) => (w.part_of_speech || "").toLowerCase().includes(pLower));
  }

  const matched = words.filter(
    (w) =>
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.note && w.note.toLowerCase().includes(q))
  );

  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const paged = matched.slice(offset, offset + parsed.data.limit).map(serializeWordCompact);

  return {
    data: {
      scope: parsed.data.set_id ? "search_single_set" : "search_account_wide",
      query: parsed.data.query,
      aggregationMetadata: {
        totalMatchingRecords: matched.length,
        uniqueMatchingWords: countUniqueWords(matched),
        page: parsed.data.page,
        limit: parsed.data.limit,
        returnedCount: paged.length,
      },
      words: paged,
    },
    summary: `Tìm thấy ${matched.length} kết quả cho "${parsed.data.query}".`,
  };
}

export async function handleCountVocabularyWords(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const allWords = await fetchAllUserActiveWords(userId);
  const scoped = parsed.data.set_id
    ? allWords.filter((w) => w.set_id === parsed.data.set_id)
    : allWords;

  const byDifficulty: Record<string, number> = {};
  const byPartOfSpeech: Record<string, number> = {};

  for (const w of scoped) {
    const diff = w.difficulty || "unspecified";
    byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    const pos = w.part_of_speech || "unspecified";
    byPartOfSpeech[pos] = (byPartOfSpeech[pos] || 0) + 1;
  }

  const uniqueWordCount = countUniqueWords(scoped);

  return {
    data: {
      scope: parsed.data.set_id ? "single_set" : "account_wide_active",
      setId: parsed.data.set_id ?? null,
      totalWordRecords: scoped.length,
      uniqueWordCount,
      note:
        scoped.length !== uniqueWordCount
          ? `Có ${scoped.length} bản ghi từ vựng trên các bộ từ, tương ứng ${uniqueWordCount} từ tiếng Anh duy nhất (một số từ xuất hiện ở nhiều bộ).`
          : "Mỗi từ chỉ xuất hiện 1 lần.",
      byDifficulty,
      byPartOfSpeech,
    },
    summary: `Tổng cộng ${scoped.length} bản ghi từ vựng (${uniqueWordCount} từ duy nhất).`,
  };
}

export async function handleGetLearningOverview(userId: string): Promise<ToolExecutionOutput> {
  const [dashboard, allWords, sets] = await Promise.all([
    StatisticsRepository.getDashboardStats(userId),
    fetchAllUserActiveWords(userId),
    fetchAllUserActiveSets(userId),
  ]);

  const uniqueWordCount = countUniqueWords(allWords);
  const vs = dashboard.dashboardVocabularyStats;
  const learnedOrMastered = vs.learnedWords + vs.masteredWords;
  const unmastered = vs.newWords + vs.learningWords;

  return {
    data: {
      scope: "account_wide_overview",
      totalSets: sets.length,
      totalWordRecords: vs.totalWords,
      uniqueWordCount,
      masteryBreakdown: {
        newWordsLv0: vs.newWords,
        learningWordsLv1: vs.learningWords,
        learnedWordsLv2ToLv4: vs.learnedWords,
        masteredWordsLv5: vs.masteredWords,
        totalLearnedOrMastered: learnedOrMastered,
        totalUnmasteredLv0ToLv1: unmastered,
        masteredRatePercent:
          vs.totalWords > 0 ? Math.round((vs.masteredWords / vs.totalWords) * 100) : 0,
        learnedOrAboveRatePercent:
          vs.totalWords > 0 ? Math.round((learnedOrMastered / vs.totalWords) * 100) : 0,
      },
      srsDueSummary: {
        dueTodayIncludingOverdue: vs.dueToday,
        overdue: vs.overdue,
      },
      streak: dashboard.streak,
      dailyGoal: dashboard.dailyProgress.goal,
      todayProgress: dashboard.dailyProgress,
      todaySummary: dashboard.todaySummary,
    },
    summary: `Tài khoản có ${sets.length} bộ từ, ${vs.totalWords} bản ghi từ (${uniqueWordCount} từ duy nhất), ${vs.masteredWords} từ thành thạo lv5, ${vs.dueToday} từ cần ôn hôm nay.`,
    cards: [
      {
        id: `overview-${Date.now()}`,
        kind: "learning_stats",
        title: "Tổng quan học tập Vocabee",
        metrics: [
          { label: "Bộ từ", value: String(sets.length) },
          { label: "Từ vựng (duy nhất)", value: `${vs.totalWords} (${uniqueWordCount})` },
          { label: "Thành thạo (lv5)", value: String(vs.masteredWords) },
          { label: "Cần ôn hôm nay", value: String(vs.dueToday) },
          { label: "Streak hiện tại", value: `${dashboard.streak} ngày` },
          { label: "Tiến độ hôm nay", value: `${dashboard.dailyProgress.progressPercent}%` },
        ],
      },
    ],
  };
}

export async function handleGetLearningStatistics(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      days: z.number().int().min(1).max(90).default(30),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const supabase = await createClient();
  const sinceIso = new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

  const [sessions, quizRes, sentenceRes, allWords] = await Promise.all([
    StudySessionRepository.getSessionsInRange(userId, sinceIso, new Date().toISOString()),
    supabase
      .from("quiz_history")
      .select("score, correct_answers, total_questions, duration, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("sentence_practice_history")
      .select("overall_score, used_correctly, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false }),
    fetchAllUserActiveWords(userId),
  ]);

  const totalStudySeconds = sessions.reduce((acc, s) => acc + (s.study_seconds ?? 0), 0);
  const totalStudiedWords = sessions.reduce((acc, s) => acc + (s.studied_words ?? 0), 0);
  const totalReviewsCompleted = sessions.reduce((acc, s) => acc + (s.reviews_completed ?? 0), 0);

  const quizzes = quizRes.data ?? [];
  const avgQuizScore =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length)
      : null;

  const sentences = sentenceRes.data ?? [];
  const avgSentenceScore =
    sentences.length > 0
      ? Math.round(sentences.reduce((acc, s) => acc + s.overall_score, 0) / sentences.length)
      : null;

  const difficultyDistribution: Record<string, number> = {};
  for (const w of allWords) {
    const d = w.difficulty || "unspecified";
    difficultyDistribution[d] = (difficultyDistribution[d] || 0) + 1;
  }

  return {
    data: {
      scope: `last_${parsed.data.days}_days_account_wide`,
      days: parsed.data.days,
      activeStudyDays: sessions.length,
      totalStudyMinutes: Math.round(totalStudySeconds / 60),
      totalStudiedWords,
      totalReviewsCompleted,
      quizStats: {
        attemptsCount: quizzes.length,
        averageScore: avgQuizScore,
      },
      sentencePracticeStats: {
        attemptsCount: sentences.length,
        averageScore: avgSentenceScore,
        correctUsageCount: sentences.filter((s) => s.used_correctly).length,
      },
      difficultyDistribution,
    },
    summary: `Trong ${parsed.data.days} ngày qua: ${sessions.length} ngày học, ${Math.round(totalStudySeconds / 60)} phút, ${totalStudiedWords} lượt học từ, ${totalReviewsCompleted} lượt ôn tập.`,
  };
}

export async function handleGetSetLearningStatistics(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const [sets, allWords] = await Promise.all([
    fetchAllUserActiveSets(userId),
    fetchAllUserActiveWords(userId),
  ]);

  const targetSets = parsed.data.set_id
    ? sets.filter((s) => s.id === parsed.data.set_id)
    : sets;

  const stats = targetSets.map((s) => {
    const words = allWords.filter((w) => w.set_id === s.id);
    const total = words.length;
    const newCount = words.filter((w) => w.masteryGroup === "new").length;
    const learningCount = words.filter((w) => w.masteryGroup === "learning").length;
    const learnedCount = words.filter((w) => w.masteryGroup === "learned").length;
    const masteredCount = words.filter((w) => w.masteryGroup === "mastered").length;
    const learnedOrAbove = learnedCount + masteredCount;

    return {
      setId: s.id,
      title: s.title,
      totalWords: total,
      uniqueWordsInSet: countUniqueWords(words),
      newWordsLv0: newCount,
      learningWordsLv1: learningCount,
      learnedWordsLv2ToLv4: learnedCount,
      masteredWordsLv5: masteredCount,
      masteryRatePercent: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
      learnedOrAboveRatePercent: total > 0 ? Math.round((learnedOrAbove / total) * 100) : 0,
      lastStudiedAt: s.last_studied_at,
    };
  });

  return {
    data: {
      scope: parsed.data.set_id ? "single_set_statistics" : "all_sets_comparison",
      setsCount: stats.length,
      sets: stats,
    },
    summary: `Đã tổng hợp tiến độ chi tiết cho ${stats.length} bộ từ vựng.`,
  };
}

export async function handleGetWordMasteryStatistics(userId: string): Promise<ToolExecutionOutput> {
  const allWords = await fetchAllUserActiveWords(userId);
  const bySrsLevel: Record<string, number> = {
    lv0: 0,
    lv1: 0,
    lv2: 0,
    lv3: 0,
    lv4: 0,
    lv5: 0,
  };
  const byDifficulty: Record<string, number> = {};
  let starredCount = 0;

  for (const w of allWords) {
    const key = `lv${Math.min(5, Math.max(0, w.srsLevel))}`;
    bySrsLevel[key] = (bySrsLevel[key] || 0) + 1;
    const diff = w.difficulty || "unspecified";
    byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    if (w.is_starred) starredCount += 1;
  }

  return {
    data: {
      scope: "account_wide_mastery",
      totalWordRecords: allWords.length,
      uniqueWordCount: countUniqueWords(allWords),
      starredCount,
      bySrsLevel,
      byDifficulty,
    },
    summary: `Phân bố thành thạo trên ${allWords.length} từ: lv0=${bySrsLevel.lv0}, lv1=${bySrsLevel.lv1}, lv2=${bySrsLevel.lv2}, lv3=${bySrsLevel.lv3}, lv4=${bySrsLevel.lv4}, lv5=${bySrsLevel.lv5}.`,
  };
}

export async function handleGetRecentLearningActivity(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      limit: z.number().int().min(1).max(30).default(10),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const supabase = await createClient();
  const lim = parsed.data.limit;

  const [studyRes, quizRes, sentenceRes, learningSessionsRes] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id, started_at, studied_words, reviews_completed, quizzes_completed, dictations_completed, sentences_completed, study_seconds")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(lim),
    supabase
      .from("quiz_history")
      .select("id, score, correct_answers, total_questions, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(lim),
    supabase
      .from("sentence_practice_history")
      .select("id, vocab_id, overall_score, used_correctly, user_sentence, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(lim),
    supabase
      .from("learning_sessions")
      .select("id, vocabulary_set_id, status, stage, score, created_at, completed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(lim),
  ]);

  return {
    data: {
      scope: "recent_activity",
      studySessions: studyRes.data ?? [],
      quizHistory: quizRes.data ?? [],
      sentencePracticeHistory: sentenceRes.data ?? [],
      adaptiveLearningSessions: learningSessionsRes.data ?? [],
    },
    summary: `Đã lấy lịch sử học tập gần đây (${(studyRes.data ?? []).length} phiên học, ${(quizRes.data ?? []).length} bài quiz, ${(learningSessionsRes.data ?? []).length} phiên adaptive).`,
  };
}

export async function handleGetSrsOverview(userId: string): Promise<ToolExecutionOutput> {
  const stats = await VocabularyStatsService.getUserVocabularyStats(userId);
  const byLevel = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };

  for (const row of stats.rows) {
    const st = row.review?.status;
    if (st === "lv5" || st === "mastered") byLevel.lv5 += 1;
    else if (st === "lv4") byLevel.lv4 += 1;
    else if (st === "lv3") byLevel.lv3 += 1;
    else if (st === "lv2") byLevel.lv2 += 1;
    else if (st === "lv1" || st === "learning") byLevel.lv1 += 1;
    else byLevel.lv0 += 1;
  }

  return {
    data: {
      scope: "account_wide_srs",
      totalWords: stats.totalWords,
      dueTodayIncludingOverdue: stats.dueToday,
      overdue: stats.overdue,
      dueTodayOnly: Math.max(0, stats.dueToday - stats.overdue),
      levelDistribution: byLevel,
      sevenDayForecast: stats.forecast.days,
    },
    summary: `SRS: ${stats.dueToday} từ cần ôn hôm nay (${stats.overdue} từ quá hạn), ${stats.masteredWords} từ đã thành thạo lv5.`,
  };
}

export async function handleGetDueReviews(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      set_id: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const allDue = parsed.data.set_id
    ? await ReviewRepository.getDueReviewsBySetId(userId, parsed.data.set_id)
    : await ReviewRepository.getDueReviews(userId);

  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const paged = allDue.slice(offset, offset + parsed.data.limit).map((item) => ({
    vocabularyId: item.vocabulary.id,
    setId: item.vocabulary.set_id,
    word: item.vocabulary.word,
    meaning: item.vocabulary.meaning,
    ipa: item.vocabulary.ipa,
    srsStatus: item.review?.status ?? "lv0",
    nextReview: item.review?.next_review ?? null,
    lastReview: item.review?.last_review ?? null,
    lastGrade: item.review?.last_grade ?? null,
    intervalDays: item.review?.interval ?? null,
  }));

  return {
    data: {
      scope: parsed.data.set_id ? "due_reviews_single_set" : "due_reviews_account_wide",
      totalDueCount: allDue.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      returnedCount: paged.length,
      items: paged,
    },
    summary: `Có ${allDue.length} từ đến hạn ôn tập (hiển thị ${paged.length} từ).`,
  };
}

export async function handleGetOverdueReviews(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = paginationSchema
    .extend({
      set_id: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const allDue = parsed.data.set_id
    ? await ReviewRepository.getDueReviewsBySetId(userId, parsed.data.set_id)
    : await ReviewRepository.getDueReviews(userId);

  const now = new Date();
  const overdueItems = allDue.filter((item) => {
    if (!item.review?.next_review) return false;
    const forecast = summarizeSrsForecast(
      [{ next_review: item.review.next_review, status: item.review.status }],
      1,
      now
    );
    return forecast.summary.overdue > 0;
  });

  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const paged = overdueItems.slice(offset, offset + parsed.data.limit).map((item) => ({
    vocabularyId: item.vocabulary.id,
    setId: item.vocabulary.set_id,
    word: item.vocabulary.word,
    meaning: item.vocabulary.meaning,
    srsStatus: item.review?.status ?? "lv0",
    nextReview: item.review?.next_review ?? null,
    lastGrade: item.review?.last_grade ?? null,
  }));

  return {
    data: {
      scope: parsed.data.set_id ? "overdue_single_set" : "overdue_account_wide",
      totalOverdueCount: overdueItems.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      returnedCount: paged.length,
      items: paged,
    },
    summary: `Có ${overdueItems.length} từ đang bị quá hạn ôn tập.`,
  };
}

export async function handleGetReviewStatistics(userId: string): Promise<ToolExecutionOutput> {
  const allWords = await fetchAllUserActiveWords(userId);
  const reviewedWords = allWords.filter((w) => Boolean(w.review));

  const gradeCounts: Record<string, number> = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    none: 0,
  };

  let easeSum = 0;
  let easeCount = 0;
  let intervalSum = 0;
  let intervalCount = 0;

  for (const w of reviewedWords) {
    const g = w.review?.last_grade ?? "none";
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    if (typeof w.review?.ease_factor === "number") {
      easeSum += w.review.ease_factor;
      easeCount += 1;
    }
    if (typeof w.review?.interval === "number") {
      intervalSum += w.review.interval;
      intervalCount += 1;
    }
  }

  return {
    data: {
      scope: "account_wide_reviews",
      totalWordsWithReviewRecord: reviewedWords.length,
      totalWordsWithoutReviewRecord: allWords.length - reviewedWords.length,
      lastGradeDistribution: gradeCounts,
      averageEaseFactor: easeCount > 0 ? Number((easeSum / easeCount).toFixed(2)) : null,
      averageIntervalDays: intervalCount > 0 ? Number((intervalSum / intervalCount).toFixed(1)) : null,
    },
    summary: `${reviewedWords.length}/${allWords.length} từ đã có bản ghi ôn tập SRS.`,
  };
}

export async function handleGetWordsNeedingAttention(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      limit: z.number().int().min(1).max(50).default(20),
      set_id: z.string().trim().optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const supabase = await createClient();
  const [allWords, sentenceRes, learningSessionsRes] = await Promise.all([
    fetchAllUserActiveWords(userId),
    supabase
      .from("sentence_practice_history")
      .select("vocab_id, overall_score, used_correctly")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("learning_sessions")
      .select("answers_history, word_states")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  const wrongCounts = new Map<string, number>();

  for (const row of sentenceRes.data ?? []) {
    if (!row.used_correctly || row.overall_score < 60) {
      wrongCounts.set(row.vocab_id, (wrongCounts.get(row.vocab_id) ?? 0) + 1);
    }
  }

  for (const session of learningSessionsRes.data ?? []) {
    const history = Array.isArray(session.answers_history)
      ? (session.answers_history as Array<Record<string, unknown>>)
      : [];
    for (const ans of history) {
      const vocabId = typeof ans.vocabularyId === "string" ? ans.vocabularyId : null;
      const isCorrect = ans.isCorrect;
      if (vocabId && isCorrect === false) {
        wrongCounts.set(vocabId, (wrongCounts.get(vocabId) ?? 0) + 1);
      }
    }
  }

  const scoped = parsed.data.set_id
    ? allWords.filter((w) => w.set_id === parsed.data.set_id)
    : allWords;

  const nowMs = Date.now();
  const scored = scoped
    .map((w) => {
      const mistakes = wrongCounts.get(w.id) ?? 0;
      const grade = w.review?.last_grade;
      const isOverdue = Boolean(
        w.review?.next_review && new Date(w.review.next_review).getTime() < nowMs && w.srsLevel >= 2
      );
      let attentionScore = mistakes * 3;
      const reasons: string[] = [];

      if (mistakes > 0) reasons.push(`Sai ${mistakes} lần trong luyện tập`);
      if (grade === "again") {
        attentionScore += 4;
        reasons.push("Đánh dấu quên (again)");
      } else if (grade === "hard") {
        attentionScore += 2;
        reasons.push("Đánh dấu khó (hard)");
      }
      if (isOverdue) {
        attentionScore += 2;
        reasons.push("Quá hạn ôn tập");
      }
      if (w.srsLevel <= 1 && w.review) {
        attentionScore += 1;
        reasons.push("Độ thành thạo thấp (lv0-lv1)");
      }

      return { word: w, attentionScore, mistakes, reasons };
    })
    .filter((x) => x.attentionScore > 0)
    .sort((a, b) => b.attentionScore - a.attentionScore)
    .slice(0, parsed.data.limit);

  const items = scored.map(({ word, attentionScore, mistakes, reasons }) => ({
    ...serializeWordCompact(word),
    attentionScore,
    mistakeCount: mistakes,
    reasons,
  }));

  return {
    data: {
      scope: parsed.data.set_id ? "weak_words_single_set" : "weak_words_account_wide",
      totalIdentified: items.length,
      words: items,
    },
    summary:
      items.length > 0
        ? `Xác định được ${items.length} từ cần chú ý/ôn lại nhiều nhất.`
        : "Chưa ghi nhận từ nào sai nhiều hoặc quá hạn trong dữ liệu hiện tại.",
    cards: items.length > 0
      ? [
          {
            id: `attention-${Date.now()}`,
            kind: "word_list",
            title: `Từ cần chú ý (${items.length})`,
            items: items.slice(0, 8).map((w) => ({
              id: w.id,
              title: w.word,
              subtitle: w.meaning,
              badge: w.srsLevel,
              detail: w.reasons.join(" · "),
            })),
          },
        ]
      : undefined,
  };
}
