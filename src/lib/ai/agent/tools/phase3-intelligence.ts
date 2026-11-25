// src/lib/ai/agent/tools/phase3-intelligence.ts
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/repositories/review.repository";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { getWordMasteryInfo, parseCefrRank } from "@/lib/learning/mastery-selection";
import { generateContextualMcqs } from "@/lib/ai/contextual-mcq";
import { VocabeeTestSchema } from "@/lib/personal-test/vocabee-test-schema";
import { createPendingConfirmation } from "../confirmation";
import { recordAiActionAudit } from "../audit";
import type { ExerciseQuestionCardItem } from "../types";
import {
  countUniqueWords,
  fetchAllUserActiveSets,
  fetchAllUserActiveWords,
  resolveOwnedSet,
  type ScopedWordRecord,
  type ToolExecutionOutput,
} from "./shared";

export async function handleAnalyzeLearningPatterns(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      days: z.number().int().min(7).max(90).default(30),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số không hợp lệ.", error: parsed.error.message };
  }

  const supabase = await createClient();
  const sinceIso = new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

  const [dashboard, sets, allWords, studyRes, quizRes, sentenceRes, learningRes] =
    await Promise.all([
      StatisticsRepository.getDashboardStats(userId),
      fetchAllUserActiveSets(userId),
      fetchAllUserActiveWords(userId),
      supabase
        .from("study_sessions")
        .select("started_at, studied_words, reviews_completed, study_seconds")
        .eq("user_id", userId)
        .gte("started_at", sinceIso)
        .order("started_at", { ascending: true }),
      supabase
        .from("quiz_history")
        .select("score, correct_answers, total_questions, created_at")
        .eq("user_id", userId)
        .gte("created_at", sinceIso),
      supabase
        .from("sentence_practice_history")
        .select("vocab_id, overall_score, used_correctly")
        .eq("user_id", userId)
        .gte("created_at", sinceIso),
      supabase
        .from("learning_sessions")
        .select("vocabulary_set_id, status, score, answers_history")
        .eq("user_id", userId)
        .gte("created_at", sinceIso),
    ]);

  const studyRows = studyRes.data ?? [];
  const quizRows = quizRes.data ?? [];
  const sentenceRows = sentenceRes.data ?? [];
  const learningRows = learningRes.data ?? [];

  const hasSufficientWords = allWords.length >= 3;
  const hasSufficientHistory =
    studyRows.length >= 2 || quizRows.length >= 1 || sentenceRows.length >= 1 || learningRows.length >= 1;

  // Difficulty / CEFR mastery breakdown
  const difficultyStats: Record<string, { total: number; masteredOrLearned: number }> = {};
  for (const w of allWords) {
    const diff = w.difficulty || "medium";
    if (!difficultyStats[diff]) difficultyStats[diff] = { total: 0, masteredOrLearned: 0 };
    difficultyStats[diff].total += 1;
    if (w.srsLevel >= 2) difficultyStats[diff].masteredOrLearned += 1;
  }

  // Per-set progress
  const setProgress = sets.map((s) => {
    const words = allWords.filter((w) => w.set_id === s.id);
    const total = words.length;
    const learnedOrAbove = words.filter((w) => w.srsLevel >= 2).length;
    const mastered = words.filter((w) => w.srsLevel >= 5).length;
    return {
      setId: s.id,
      title: s.title,
      totalWords: total,
      learnedRatePercent: total > 0 ? Math.round((learnedOrAbove / total) * 100) : 0,
      masteredRatePercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      lastStudiedAt: s.last_studied_at,
    };
  });

  // Identify weak words from real records
  const mistakeCount = new Map<string, number>();
  for (const sr of sentenceRows) {
    if (!sr.used_correctly || sr.overall_score < 60) {
      mistakeCount.set(sr.vocab_id, (mistakeCount.get(sr.vocab_id) ?? 0) + 1);
    }
  }
  for (const lr of learningRows) {
    const history = Array.isArray(lr.answers_history)
      ? (lr.answers_history as Array<Record<string, unknown>>)
      : [];
    for (const h of history) {
      if (typeof h.vocabularyId === "string" && h.isCorrect === false) {
        mistakeCount.set(h.vocabularyId, (mistakeCount.get(h.vocabularyId) ?? 0) + 1);
      }
    }
  }

  const weakWords = allWords
    .filter((w) => (mistakeCount.get(w.id) ?? 0) > 0 || w.review?.last_grade === "again")
    .sort((a, b) => (mistakeCount.get(b.id) ?? 0) - (mistakeCount.get(a.id) ?? 0))
    .slice(0, 15)
    .map((w) => ({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      setTitle: w.setTitle,
      mistakesRecorded: mistakeCount.get(w.id) ?? 0,
      lastGrade: w.review?.last_grade ?? null,
      srsLevel: `lv${w.srsLevel}`,
    }));

  return {
    data: {
      scope: `learning_analysis_${parsed.data.days}_days`,
      dataSufficiency: {
        hasVocabularyData: hasSufficientWords,
        hasActivityHistory: hasSufficientHistory,
        note: !hasSufficientHistory
          ? "Chưa có đủ lịch sử phiên học/kiểm tra gần đây để kết luận xu hướng dài hạn."
          : "Đủ dữ liệu thực tế để phân tích xu hướng học tập.",
      },
      accountTotals: {
        totalSets: sets.length,
        totalWordRecords: allWords.length,
        uniqueWordCount: countUniqueWords(allWords),
        masteredLv5: dashboard.dashboardVocabularyStats.masteredWords,
        learnedLv2To4: dashboard.dashboardVocabularyStats.learnedWords,
        learningLv1: dashboard.dashboardVocabularyStats.learningWords,
        newLv0: dashboard.dashboardVocabularyStats.newWords,
        dueToday: dashboard.dashboardVocabularyStats.dueToday,
        overdue: dashboard.dashboardVocabularyStats.overdue,
        streak: dashboard.streak,
      },
      activitySummary: {
        activeStudyDays: studyRows.length,
        totalStudyMinutes: Math.round(
          studyRows.reduce((s, r) => s + (r.study_seconds ?? 0), 0) / 60
        ),
        quizAttempts: quizRows.length,
        averageQuizScore:
          quizRows.length > 0
            ? Math.round(quizRows.reduce((s, q) => s + q.score, 0) / quizRows.length)
            : null,
        sentenceAttempts: sentenceRows.length,
        averageSentenceScore:
          sentenceRows.length > 0
            ? Math.round(
                sentenceRows.reduce((s, r) => s + r.overall_score, 0) / sentenceRows.length
              )
            : null,
      },
      difficultyBreakdown: difficultyStats,
      setProgress,
      weakWords,
    },
    summary: `Đã phân tích ${allWords.length} từ trên ${sets.length} bộ từ (${studyRows.length} ngày học trong ${parsed.data.days} ngày qua).`,
  };
}

export async function handleGetPersonalizedRecommendations(
  userId: string
): Promise<ToolExecutionOutput> {
  const [sets, allWords, dueItems] = await Promise.all([
    fetchAllUserActiveSets(userId),
    fetchAllUserActiveWords(userId),
    ReviewRepository.getDueReviews(userId),
  ]);

  const now = new Date();

  const duePriority = dueItems.slice(0, 10).map((item) => ({
    vocabularyId: item.vocabulary.id,
    word: item.vocabulary.word,
    meaning: item.vocabulary.meaning,
    setId: item.vocabulary.set_id,
    srsStatus: item.review?.status ?? "lv0",
    nextReview: item.review?.next_review ?? null,
    recommendedAction: "Ôn tập SRS ngay hôm nay",
  }));

  const wordsToRelearn = allWords
    .filter((w) => {
      const info = getWordMasteryInfo({ review: w.review }, now);
      return info.status === "weak" || w.review?.last_grade === "again";
    })
    .slice(0, 10)
    .map((w) => ({
      vocabularyId: w.id,
      word: w.word,
      meaning: w.meaning,
      setTitle: w.setTitle,
      srsLevel: `lv${w.srsLevel}`,
      recommendedAction: "Học lại bằng Flashcard hoặc Đặt câu",
    }));

  const newWordsToLearn = allWords
    .filter((w) => w.srsLevel === 0)
    .sort((a, b) => parseCefrRank(a.difficulty) - parseCefrRank(b.difficulty))
    .slice(0, 10)
    .map((w) => ({
      vocabularyId: w.id,
      word: w.word,
      meaning: w.meaning,
      setTitle: w.setTitle,
      difficulty: w.difficulty,
    }));

  const setsToPrioritize = sets
    .map((s) => {
      const words = allWords.filter((w) => w.set_id === s.id);
      const unlearned = words.filter((w) => w.srsLevel < 2).length;
      const dueInSet = dueItems.filter((d) => d.vocabulary.set_id === s.id).length;
      return {
        setId: s.id,
        title: s.title,
        totalWords: words.length,
        unlearnedCount: unlearned,
        dueReviewCount: dueInSet,
        priorityScore: dueInSet * 3 + unlearned,
      };
    })
    .filter((s) => s.totalWords > 0 && s.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return {
    data: {
      scope: "personalized_recommendations_srs_grounded",
      dueReviewsCount: dueItems.length,
      dueReviewPriority: duePriority,
      wordsToRelearn,
      recommendedNewWords: newWordsToLearn,
      prioritySets: setsToPrioritize,
      srsNote: "Lịch ôn tập tuân theo hệ thống SRS hiện tại của Vocabee (lv2: +3 ngày, lv3: +7 ngày, lv4 -> lv5 thành thạo).",
    },
    summary: `Gợi ý hôm nay: ${dueItems.length} từ cần ôn SRS, ${wordsToRelearn.length} từ cần củng cố lại, ${setsToPrioritize.length} bộ từ ưu tiên.`,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDeterministicExercises(
  selected: ScopedWordRecord[],
  pool: ScopedWordRecord[],
  exerciseType: ExerciseQuestionCardItem["questionType"],
  count: number
): ExerciseQuestionCardItem[] {
  const targets = selected.slice(0, count);
  const questions: ExerciseQuestionCardItem[] = [];

  for (let idx = 0; idx < targets.length; idx++) {
    const w = targets[idx];
    const distractors = shuffleArray(
      pool.filter(
        (other) =>
          other.id !== w.id &&
          other.meaning.trim().toLowerCase() !== w.meaning.trim().toLowerCase() &&
          other.word.trim().toLowerCase() !== w.word.trim().toLowerCase()
      )
    );

    if (exerciseType === "fill_in_blank" || exerciseType === "sentence_completion") {
      const sentence =
        w.example && new RegExp(`\\b${escapeRegExp(w.word)}\\b`, "i").test(w.example)
          ? w.example.replace(new RegExp(`\\b${escapeRegExp(w.word)}\\b`, "gi"), "______")
          : `Complete the sentence with the word meaning "${w.meaning}": ______`;

      questions.push({
        id: `q_${w.id}_${idx}`,
        vocabularyId: w.id,
        word: w.word,
        questionType: exerciseType,
        prompt: sentence,
        correctAnswer: w.word,
        explanation: `"${w.word}" (${w.ipa || "N/A"}) có nghĩa là "${w.meaning}".${
          w.example ? ` Ví dụ: ${w.example}` : ""
        }`,
      });
      continue;
    }

    if (exerciseType === "synonym_selection" && w.synonyms && w.synonyms.length > 0) {
      const correctSyn = w.synonyms[0];
      const synDistractors = distractors
        .map((d) => (d.synonyms && d.synonyms[0]) || d.word)
        .filter((s) => s.toLowerCase() !== correctSyn.toLowerCase() && s.toLowerCase() !== w.word.toLowerCase())
        .slice(0, 3);

      while (synDistractors.length < 3) {
        synDistractors.push(`option_${synDistractors.length + 1}`);
      }

      const options = shuffleArray([correctSyn, ...synDistractors]);
      questions.push({
        id: `q_${w.id}_${idx}`,
        vocabularyId: w.id,
        word: w.word,
        questionType: "synonym_selection",
        prompt: `Chọn từ đồng nghĩa gần nhất với "${w.word}" (${w.meaning}):`,
        options,
        correctAnswer: correctSyn,
        explanation: `"${correctSyn}" là từ đồng nghĩa của "${w.word}" (${w.meaning}).`,
      });
      continue;
    }

    // Default unambiguous MCQ (word -> meaning)
    const fallbackMeanings = ["tăng cường đáng kể", "duy trì ổn định", "giảm nhẹ tác động", "phân tích chi tiết"];
    const meaningDistractors: string[] = [];
    for (const d of distractors) {
      if (meaningDistractors.length >= 3) break;
      if (!meaningDistractors.includes(d.meaning)) {
        meaningDistractors.push(d.meaning);
      }
    }
    for (const fm of fallbackMeanings) {
      if (meaningDistractors.length >= 3) break;
      if (fm !== w.meaning && !meaningDistractors.includes(fm)) {
        meaningDistractors.push(fm);
      }
    }

    const options = shuffleArray([w.meaning, ...meaningDistractors]);
    questions.push({
      id: `q_${w.id}_${idx}`,
      vocabularyId: w.id,
      word: w.word,
      questionType: exerciseType === "synonym_selection" ? "mcq" : exerciseType,
      prompt: `Nghĩa đúng của từ "${w.word}"${w.part_of_speech ? ` (${w.part_of_speech})` : ""} là gì?`,
      options,
      correctAnswer: w.meaning,
      explanation: `"${w.word}"${w.ipa ? ` ${w.ipa}` : ""} có nghĩa là "${w.meaning}".${
        w.example ? ` Ví dụ: "${w.example}"` : ""
      }`,
    });
  }

  return questions;
}

export async function handleGeneratePracticeExercise(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      set_id: z.string().trim().optional(),
      set_title: z.string().trim().optional(),
      focus: z.enum(["all", "weak", "due", "unlearned"]).default("all"),
      exercise_type: z
        .enum([
          "mcq",
          "contextual_mcq",
          "fill_in_blank",
          "sentence_completion",
          "synonym_selection",
          "word_formation",
          "cloze_test",
        ])
        .default("mcq"),
      count: z.number().int().min(1).max(15).default(5),
      word_ids: z.array(z.string().trim().min(1)).max(20).optional(),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số tạo bài tập không hợp lệ.", error: parsed.error.message };
  }

  let targetSetId = parsed.data.set_id;
  if (!targetSetId && parsed.data.set_title) {
    const resolved = await resolveOwnedSet(userId, { setTitle: parsed.data.set_title });
    if (resolved.set) targetSetId = resolved.set.id;
  }

  const allWords = await fetchAllUserActiveWords(userId);
  let candidates = targetSetId
    ? allWords.filter((w) => w.set_id === targetSetId)
    : allWords;

  if (parsed.data.word_ids && parsed.data.word_ids.length > 0) {
    const idSet = new Set(parsed.data.word_ids);
    candidates = candidates.filter((w) => idSet.has(w.id));
  } else if (parsed.data.focus === "due") {
    const due = await ReviewRepository.getDueReviews(userId);
    const dueSet = new Set(due.map((d) => d.vocabulary.id));
    candidates = candidates.filter((w) => dueSet.has(w.id));
  } else if (parsed.data.focus === "weak") {
    const weak = candidates.filter(
      (w) => w.review?.last_grade === "again" || w.review?.last_grade === "hard" || w.srsLevel <= 1
    );
    if (weak.length > 0) candidates = weak;
  } else if (parsed.data.focus === "unlearned") {
    const unlearned = candidates.filter((w) => w.srsLevel < 2);
    if (unlearned.length > 0) candidates = unlearned;
  }

  if (candidates.length === 0) {
    return {
      data: { generatedCount: 0, questions: [] },
      summary: "Không có từ vựng phù hợp trong phạm vi đã chọn để tạo bài tập.",
    };
  }

  const selected = shuffleArray(candidates).slice(0, parsed.data.count);
  let questions: ExerciseQuestionCardItem[] = [];

  if (parsed.data.exercise_type === "contextual_mcq" && selected.length >= 2) {
    const aiQuestions = await generateContextualMcqs(
      selected.map((w) => ({
        id: w.id,
        word: w.word,
        meaning: w.meaning,
        partOfSpeech: w.part_of_speech,
        example: w.example,
        example_translation: w.example_translation,
      })),
      selected.length
    );

    questions = aiQuestions.map((q, idx) => ({
      id: q.id || `ctx_${idx}`,
      vocabularyId: q.vocabularyId,
      word: q.targetWord,
      questionType: "contextual_mcq",
      prompt: q.sentence,
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      explanation: q.explanation,
    }));
  } else {
    questions = buildDeterministicExercises(
      selected,
      allWords,
      parsed.data.exercise_type,
      parsed.data.count
    );
  }

  return {
    data: {
      scope: "generated_practice_exercise",
      exerciseType: parsed.data.exercise_type,
      questionCount: questions.length,
      srsModified: false,
      questions,
    },
    summary: `Đã tạo ${questions.length} câu hỏi luyện tập từ dữ liệu từ vựng thực tế của bạn (chưa làm thay đổi dữ liệu SRS).`,
    cards: [
      {
        id: `quiz-${Date.now()}`,
        kind: "practice_quiz",
        title: `Bài luyện tập nhanh (${questions.length} câu)`,
        subtitle: "Chọn đáp án để tự kiểm tra. Kết quả chỉ lưu SRS khi bạn làm bài.",
        questions,
      },
    ],
  };
}

export async function handlePrepareSavePersonalTest(
  userId: string,
  rawArgs: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(120),
      set_id: z.string().trim().optional(),
      set_title: z.string().trim().optional(),
      word_ids: z.array(z.string().trim().min(1)).max(30).optional(),
      max_words: z.number().int().min(4).max(20).default(10),
    })
    .safeParse(rawArgs);

  if (!parsed.success) {
    return { data: null, summary: "Tham số tạo bài kiểm tra không hợp lệ.", error: parsed.error.message };
  }

  let targetSetId = parsed.data.set_id;
  if (!targetSetId && parsed.data.set_title) {
    const resolved = await resolveOwnedSet(userId, { setTitle: parsed.data.set_title });
    if (resolved.set) targetSetId = resolved.set.id;
  }

  const allWords = await fetchAllUserActiveWords(userId);
  let pool = targetSetId ? allWords.filter((w) => w.set_id === targetSetId) : allWords;
  if (parsed.data.word_ids && parsed.data.word_ids.length > 0) {
    const idSet = new Set(parsed.data.word_ids);
    pool = pool.filter((w) => idSet.has(w.id));
  }

  const selected = pool.slice(0, parsed.data.max_words);
  if (selected.length < 2) {
    return {
      data: null,
      summary: "Cần ít nhất 2 từ vựng để tạo bài kiểm tra cá nhân hoàn chỉnh.",
      error: "Không đủ từ vựng để tạo Personal Test.",
    };
  }

  const wordBank = selected.map((w) => w.word);
  const matchingItems = selected.map((w, idx) => ({
    id: idx + 1,
    word: w.word,
    definition: w.meaning,
    explanation: `"${w.word}" có nghĩa là "${w.meaning}".`,
  }));

  const sentenceItems = selected.map((w, idx) => ({
    id: idx + 1,
    sentence:
      w.example && new RegExp(`\\b${escapeRegExp(w.word)}\\b`, "i").test(w.example)
        ? w.example.replace(new RegExp(`\\b${escapeRegExp(w.word)}\\b`, "gi"), "______")
        : `Fill in the word that means "${w.meaning}": ______`,
    answer: w.word,
    explanation: `"${w.word}" mang nghĩa "${w.meaning}".`,
  }));

  const synonymsItems = selected.map((w, idx) => ({
    id: idx + 1,
    word: w.word,
    synonyms: w.synonyms && w.synonyms.length > 0 ? w.synonyms.slice(0, 2) : [w.meaning],
    explanation:
      w.synonyms && w.synonyms.length > 0
        ? `Từ đồng nghĩa của "${w.word}": ${w.synonyms.slice(0, 2).join(", ")}.`
        : `"${w.word}" có nghĩa tương ứng "${w.meaning}".`,
  }));

  const clozePassage = selected
    .map((w, idx) => `(${idx + 1}) ______ [${w.meaning}]`)
    .join(" — ");

  const clozeAnswers = selected.map((w, idx) => ({
    id: idx + 1,
    answer: w.word,
    explanation: `Vị trí (${idx + 1}) là "${w.word}" (${w.meaning}).`,
  }));

  const testCandidate = {
    schema: "vocabee-test-v1" as const,
    title: parsed.data.title,
    total_words: selected.length,
    total_sets: 1,
    sets: [
      {
        id: "set_1",
        label: parsed.data.title,
        words: wordBank,
        exercises: [
          { type: "matching" as const, items: matchingItems },
          { type: "sentence_completion" as const, word_bank: wordBank, items: sentenceItems },
          { type: "synonyms_matching" as const, items: synonymsItems },
          {
            type: "cloze_test" as const,
            word_bank: wordBank,
            passage: clozePassage,
            answers: clozeAnswers,
          },
        ],
      },
    ],
  };

  const validated = VocabeeTestSchema.safeParse(testCandidate);
  if (!validated.success) {
    return {
      data: null,
      summary: "Không thể cấu trúc bài kiểm tra hợp lệ từ các từ đã chọn.",
      error: validated.error.issues[0]?.message,
    };
  }

  const confirmation = createPendingConfirmation({
    userId,
    action: "save_personal_test",
    title: "Xác nhận lưu bài kiểm tra cá nhân",
    description: `Lưu bài kiểm tra "${parsed.data.title}" gồm ${selected.length} từ vựng và 4 dạng bài tập.`,
    targetName: parsed.data.title,
    affectedCount: 1,
    affectedSummary: `1 bài kiểm tra (${selected.length} từ, 4 phần bài tập)`,
    consequences: [
      "Bài kiểm tra sẽ được lưu vào mục Personal Test để bạn làm bài và chấm điểm.",
      "Điểm SRS hiện tại không thay đổi cho tới khi bạn làm bài.",
    ],
    previewItems: selected.slice(0, 6).map((w) => ({ label: w.word, detail: w.meaning })),
    params: {
      test: validated.data,
    },
  });

  await recordAiActionAudit({
    actionId: confirmation.actionId,
    userId,
    actionType: "save_personal_test",
    targetIds: selected.map((w) => w.id),
    affectedCount: 1,
    status: "pending",
    summary: `Pending save personal test "${parsed.data.title}" (${selected.length} words)`,
  });

  return {
    data: {
      requiresConfirmation: true,
      actionId: confirmation.actionId,
      wordCount: selected.length,
    },
    summary: `Đã chuẩn bị bài kiểm tra "${parsed.data.title}" (${selected.length} từ). Chờ người dùng xác nhận lưu.`,
    confirmations: [confirmation],
  };
}
