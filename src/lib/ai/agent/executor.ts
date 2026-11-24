// src/lib/ai/agent/executor.ts
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";
import { VocabSetSummaryService } from "@/lib/statistics/vocab-set-summary.service";
import { classifyForecastRow } from "@/lib/srs/upcoming-reviews";
import { generateVocabSetId } from "@/lib/id/generate-vocab-set-id";
import { getRandomVocabularySetColor } from "@/constants/vocab-set";
import { generateConfirmationToken } from "./confirmation";
import { PendingConfirmation, DestructiveActionType } from "./types";
import { revalidatePath } from "next/cache";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface ToolExecutionResult {
  data?: unknown;
  error?: string;
  confirmation?: PendingConfirmation | null;
  summary: string;
}

export class AgentExecutor {
  constructor(private readonly userId: string) {}

  /**
   * Main entry point to dispatch a tool call.
   */
  async execute(name: string, rawArgs: Record<string, unknown>): Promise<ToolExecutionResult> {
    try {
      switch (name) {
        // --- Queries ---
        case "get_vocabulary_overview":
          return await this.getVocabularyOverview();
        case "list_vocab_sets":
          return await this.listVocabSets(rawArgs);
        case "get_vocab_set_details":
          return await this.getVocabSetDetails(rawArgs);
        case "search_vocabulary":
          return await this.searchVocabulary(rawArgs);
        case "get_vocabulary_details":
          return await this.getVocabularyDetails(rawArgs);
        case "lookup_dictionary_word":
          return await this.lookupDictionaryWord(rawArgs);
        case "find_duplicate_vocabularies":
          return await this.findDuplicateVocabularies(rawArgs);
        case "get_vocabularies_by_cefr":
          return await this.getVocabulariesByCefr(rawArgs);
        case "get_learning_progress":
          return await this.getLearningProgress();
        case "get_review_schedule":
          return await this.getReviewSchedule(rawArgs);
        case "get_srs_sets_distribution":
          return await this.getSrsSetsDistribution();
        case "get_learning_history":
          return await this.getLearningHistory(rawArgs);
        case "get_frequently_incorrect_words":
          return await this.getFrequentlyIncorrectWords(rawArgs);
        case "get_sets_learning_comparison":
          return await this.getSetsLearningComparison();

        // --- Safe Writes ---
        case "create_vocab_set":
          return await this.createVocabSet(rawArgs);
        case "rename_vocab_set":
          return await this.renameVocabSet(rawArgs);
        case "add_vocabulary":
          return await this.addVocabulary(rawArgs);
        case "bulk_add_vocabulary":
          return await this.bulkAddVocabulary(rawArgs);
        case "update_vocabulary":
          return await this.updateVocabulary(rawArgs);

        // --- Destructive Actions (Confirmation Required) ---
        case "delete_vocab_set":
          return await this.prepareDeleteVocabSet(rawArgs);
        case "delete_vocabulary":
          return await this.prepareDeleteVocabulary(rawArgs);
        case "reset_vocab_set_progress":
          return await this.prepareResetVocabSetProgress(rawArgs);
        case "delete_vocab_set_learning_history":
          return await this.prepareDeleteVocabSetLearningHistory(rawArgs);
        case "reset_single_vocabulary_progress":
          return await this.prepareResetSingleVocabularyProgress(rawArgs);

        default:
          return {
            error: `Tool '${name}' không được hỗ trợ.`,
            summary: `Không tìm thấy tool '${name}'.`,
          };
      }
    } catch (err: unknown) {
      console.error(`[AgentExecutor] Error executing tool '${name}':`, err);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        error: `Lỗi truy vấn cơ sở dữ liệu: ${msg}`,
        summary: `Thất bại khi thực thi tool '${name}'.`,
      };
    }
  }

  // ==========================================
  // QUERY IMPLEMENTATIONS
  // ==========================================

  private async getVocabularyOverview(): Promise<ToolExecutionResult> {
    const stats = await VocabularyStatsService.getUserVocabularyStats(this.userId);
    const supabase = await createClient();

    // Query CEFR level counts & starred count
    const { data: vocabs, error } = await supabase
      .from("vocabularies")
      .select("difficulty, is_starred")
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    if (error) throw error;

    const cefrCounts: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      unassigned: 0,
    };

    let totalStarred = 0;
    for (const v of vocabs ?? []) {
      const lvl = (v.difficulty?.toUpperCase() || "").trim();
      if (lvl in cefrCounts) {
        cefrCounts[lvl] += 1;
      } else {
        cefrCounts.unassigned += 1;
      }
      if (v.is_starred) totalStarred += 1;
    }

    const { count: setsCount } = await supabase
      .from("vocab_sets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    const result = {
      total_words: stats.totalWords,
      total_sets: setsCount ?? 0,
      total_starred: totalStarred,
      by_learning_status: {
        new_unlearned: stats.newWords,
        learning: stats.learningWords,
        learned: stats.learnedWords,
        mastered: stats.masteredWords,
      },
      by_cefr_level: cefrCounts,
      reviews_due_today: stats.dueToday,
      reviews_overdue: stats.overdue,
    };

    return {
      data: result,
      summary: `Đã thống kê tổng quan: ${stats.totalWords} từ vựng trong ${setsCount ?? 0} bộ từ. Đã thuộc: ${stats.masteredWords}, đang học: ${stats.learningWords}, chưa học: ${stats.newWords}.`,
    };
  }

  private async listVocabSets(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const { data: sets } = await VocabSetRepository.getVocabSets(this.userId, {
      search,
      limit: 100,
    });
    const summaries = await VocabSetSummaryService.getUserVocabSetSummaries(this.userId);

    const enriched = sets.map((s) => {
      const sum = summaries[s.id] || {
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        lastStudiedAt: null,
      };
      const progressPercent =
        sum.totalWords > 0 ? Math.round((sum.masteredWords / sum.totalWords) * 100) : 0;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        total_words: sum.totalWords,
        mastered_words: sum.masteredWords,
        learning_words: sum.learningWords,
        new_unlearned_words: sum.newWords,
        progress_percent: progressPercent,
        last_studied_at: s.last_studied_at || sum.lastStudiedAt,
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    return {
      data: {
        total_sets: enriched.length,
        sets: enriched,
      },
      summary: `Tìm thấy ${enriched.length} bộ từ vựng cá nhân.`,
    };
  }

  private async getVocabSetDetails(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;

    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: `Không tìm thấy bộ từ vựng với thông tin: ${setId || setName || "không xác định"}.`,
        summary: "Bộ từ không tồn tại hoặc không thuộc quyền sở hữu của bạn.",
      };
    }

    // Get vocabularies in set with reviews
    const { data: words, error } = await supabase
      .from("vocabularies")
      .select("id, word, ipa, part_of_speech, meaning, example, example_translation, difficulty, is_starred, review:reviews(*)")
      .eq("set_id", targetSet.id)
      .eq("owner_id", this.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;

    const cefrDistribution: Record<string, number> = {};
    const statusDistribution = { new: 0, learning: 0, learned: 0, mastered: 0 };

    const formattedWords = (words ?? []).map((w) => {
      const review = Array.isArray(w.review) ? (w.review[0] as ReviewRow | undefined) : (w.review as ReviewRow | null);
      let status = "new";
      const lvl = review?.status?.startsWith("lv") ? Number(review.status.slice(2)) : null;
      if (review?.status === "lv5" || review?.status === "mastered" || lvl === 5) {
        status = "mastered";
        statusDistribution.mastered += 1;
      } else if (lvl !== null && lvl >= 2) {
        status = "learned";
        statusDistribution.learned += 1;
      } else if (review?.status === "learning" || lvl === 1) {
        status = "learning";
        statusDistribution.learning += 1;
      } else {
        status = "new";
        statusDistribution.new += 1;
      }

      const diff = w.difficulty || "Unassigned";
      cefrDistribution[diff] = (cefrDistribution[diff] || 0) + 1;

      return {
        id: w.id,
        word: w.word,
        ipa: w.ipa,
        part_of_speech: w.part_of_speech,
        meaning: w.meaning,
        example: w.example,
        example_translation: w.example_translation,
        difficulty: w.difficulty,
        is_starred: w.is_starred,
        status,
        next_review: review?.next_review || null,
      };
    });

    const result = {
      set_id: targetSet.id,
      title: targetSet.title,
      description: targetSet.description,
      total_words: formattedWords.length,
      status_distribution: statusDistribution,
      cefr_distribution: cefrDistribution,
      sample_words: formattedWords.slice(0, 30),
    };

    return {
      data: result,
      summary: `Bộ từ '${targetSet.title}' có ${formattedWords.length} từ (Đã thuộc: ${statusDistribution.mastered}, Đang học: ${statusDistribution.learning}, Chưa học: ${statusDistribution.new}).`,
    };
  }

  private async searchVocabulary(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const query = typeof args.query === "string" ? args.query.trim() : "";
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const cefr = typeof args.cefr_level === "string" ? args.cefr_level.trim() : null;

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, meaning, ipa, part_of_speech, difficulty, set_id, is_starred, vocab_sets!inner(id, title, deleted_at), review:reviews(*)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null)
      .is("vocab_sets.deleted_at", null);

    if (query) {
      dbQuery = dbQuery.or(`word.ilike.%${query}%,meaning.ilike.%${query}%`);
    }

    if (setId) {
      dbQuery = dbQuery.eq("set_id", setId);
    }

    if (cefr) {
      dbQuery = dbQuery.ilike("difficulty", cefr);
    }

    const { data: rows, error } = await dbQuery.limit(30);
    if (error) throw error;

    const results = (rows ?? []).map((row) => {
      const set = Array.isArray(row.vocab_sets) ? row.vocab_sets[0] : row.vocab_sets;
      const review = Array.isArray(row.review) ? (row.review[0] as ReviewRow | undefined) : (row.review as ReviewRow | null);
      return {
        id: row.id,
        word: row.word,
        meaning: row.meaning,
        ipa: row.ipa,
        part_of_speech: row.part_of_speech,
        difficulty: row.difficulty,
        set_title: set?.title || "Không xác định",
        set_id: row.set_id,
        is_starred: row.is_starred,
        status: review?.status || "new",
        next_review: review?.next_review || null,
      };
    });

    return {
      data: {
        query,
        count: results.length,
        matches: results,
      },
      summary: `Tìm thấy ${results.length} từ khớp với '${query}'.`,
    };
  }

  private async getVocabularyDetails(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const word = typeof args.word === "string" ? args.word.trim() : null;
    const vocabId = typeof args.vocabulary_id === "string" ? args.vocabulary_id.trim() : null;

    let dbQuery = supabase
      .from("vocabularies")
      .select("*, vocab_sets!inner(id, title), review:reviews(*)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    if (vocabId) {
      dbQuery = dbQuery.eq("id", vocabId);
    } else if (word) {
      dbQuery = dbQuery.ilike("word", word);
    } else {
      return { error: "Vui lòng cung cấp từ tiếng Anh hoặc ID từ vựng.", summary: "Thiếu tham số tra cứu từ." };
    }

    const { data, error } = await dbQuery.limit(1).maybeSingle();
    if (error) throw error;

    if (!data) {
      return {
        error: `Không tìm thấy từ vựng '${word || vocabId}' trong kho từ của bạn.`,
        summary: `Từ vựng không tồn tại trong tài khoản.`,
      };
    }

    const set = Array.isArray(data.vocab_sets) ? data.vocab_sets[0] : data.vocab_sets;
    const review = Array.isArray(data.review) ? (data.review[0] as ReviewRow | undefined) : (data.review as ReviewRow | null);

    const details = {
      id: data.id,
      word: data.word,
      meaning: data.meaning,
      ipa: data.ipa,
      part_of_speech: data.part_of_speech,
      example: data.example,
      example_translation: data.example_translation,
      synonyms: data.synonyms,
      antonyms: data.antonyms,
      note: data.note,
      difficulty: data.difficulty,
      set_title: set?.title || "Không xác định",
      set_id: data.set_id,
      is_starred: data.is_starred,
      review_status: review?.status || "new",
      next_review: review?.next_review || null,
      last_review: review?.last_review || null,
      last_grade: review?.last_grade || null,
      ease_factor: review?.ease_factor || null,
      interval_days: review?.interval || null,
      repetitions: review?.repetitions || 0,
    };

    return {
      data: details,
      summary: `Thông tin từ '${data.word}': ${data.meaning} (${data.part_of_speech || "từ"}). Trạng thái SRS: ${details.review_status}.`,
    };
  }

  private async lookupDictionaryWord(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const rawWord = typeof args.word === "string" ? args.word.trim() : "";
    if (!rawWord) {
      return {
        error: "Vui lòng cung cấp từ vựng tiếng Anh cần tra cứu.",
        summary: "Thiếu từ khóa tra cứu từ điển.",
      };
    }

    try {
      const { DictionaryService } = await import("@/lib/dictionary/dictionary.service");
      const dictService = new DictionaryService();
      const result = await dictService.lookup(rawWord);

      if (!result) {
        return {
          data: {
            word: rawWord,
            found: false,
            message: `Không tìm thấy từ "${rawWord}" trong hệ thống từ điển chuẩn của Vocabee.`,
          },
          summary: `Không tìm thấy từ "${rawWord}" trong từ điển Vocabee.`,
        };
      }

      return {
        data: {
          word: result.word,
          ipa: result.ipa || result.ipaUs || result.ipaUk || "",
          primaryVietnamese: result.primaryVietnamese || "",
          collocations: result.collocations || [],
          meanings: (result.meanings || []).map((m) => ({
            part_of_speech: m.partOfSpeech,
            vietnamese_summary: m.vietnameseSummary,
            definitions: (m.definitions || []).map((d) => ({
              definition_en: d.definitionEn,
              definition_vi: d.definitionVi,
              example_en: d.exampleEn,
              example_vi: d.exampleVi,
            })),
            synonyms: m.synonyms || [],
            antonyms: m.antonyms || [],
          })),
          source: "Vocabee Official Dictionary",
        },
        summary: `Đã tra cứu thành công từ "${result.word}" trong từ điển Vocabee (IPA: /${result.ipa || ""}/).`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        error: `Lỗi khi tra cứu từ điển: ${msg}`,
        summary: `Không thể tra cứu từ "${rawWord}" từ từ điển.`,
      };
    }
  }

  private async findDuplicateVocabularies(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, meaning, set_id, vocab_sets!inner(id, title, deleted_at)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null)
      .is("vocab_sets.deleted_at", null);

    if (setId) {
      dbQuery = dbQuery.eq("set_id", setId);
    }

    const { data: rows, error } = await dbQuery;
    if (error) throw error;

    const wordMap = new Map<string, Array<{ id: string; meaning: string; setId: string; setTitle: string }>>();
    for (const r of rows ?? []) {
      const lower = r.word.trim().toLowerCase();
      const set = Array.isArray(r.vocab_sets) ? r.vocab_sets[0] : r.vocab_sets;
      const list = wordMap.get(lower) || [];
      list.push({
        id: r.id,
        meaning: r.meaning,
        setId: r.set_id,
        setTitle: set?.title || "Không xác định",
      });
      wordMap.set(lower, list);
    }

    const duplicates = Array.from(wordMap.entries())
      .filter(([, instances]) => instances.length > 1)
      .map(([word, instances]) => ({
        word,
        count: instances.length,
        instances,
      }));

    return {
      data: {
        total_unique_words: wordMap.size,
        duplicate_words_count: duplicates.length,
        duplicates,
      },
      summary:
        duplicates.length > 0
          ? `Phát hiện ${duplicates.length} từ bị trùng lặp trong kho từ.`
          : `Tuyệt vời! Không phát hiện từ nào bị trùng lặp.`,
    };
  }

  private async getVocabulariesByCefr(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const level = typeof args.level === "string" ? args.level.trim().toUpperCase() : "";
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;

    let targetSetId = setId;
    if (!targetSetId && setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("id")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .limit(1)
        .maybeSingle();
      if (data) targetSetId = data.id;
    }

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, meaning, ipa, part_of_speech, difficulty, set_id, vocab_sets!inner(id, title, deleted_at)")
      .eq("owner_id", this.userId)
      .ilike("difficulty", level)
      .is("deleted_at", null)
      .is("vocab_sets.deleted_at", null);

    if (targetSetId) {
      dbQuery = dbQuery.eq("set_id", targetSetId);
    }

    const { data: rows, error } = await dbQuery.limit(50);
    if (error) throw error;

    const formatted = (rows ?? []).map((r) => {
      const set = Array.isArray(r.vocab_sets) ? r.vocab_sets[0] : r.vocab_sets;
      return {
        id: r.id,
        word: r.word,
        meaning: r.meaning,
        ipa: r.ipa,
        part_of_speech: r.part_of_speech,
        difficulty: r.difficulty,
        set_title: set?.title || "Không xác định",
      };
    });

    return {
      data: {
        level,
        count: formatted.length,
        words: formatted,
      },
      summary: `Tìm thấy ${formatted.length} từ ở cấp độ ${level}${targetSetId ? " trong bộ từ đã chọn" : ""}.`,
    };
  }

  private async getLearningProgress(): Promise<ToolExecutionResult> {
    const stats = await VocabularyStatsService.getUserVocabularyStats(this.userId);
    const supabase = await createClient();

    // Profile for streak & daily goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak, longest_streak, daily_goal, level")
      .eq("id", this.userId)
      .maybeSingle();

    // Today's study session
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todaySessions } = await supabase
      .from("study_sessions")
      .select("studied_words, remembered_words, study_seconds, reviews_completed, quizzes_completed")
      .eq("user_id", this.userId)
      .gte("started_at", todayStart.toISOString());

    let todayStudied = 0;
    let todayReviewed = 0;
    let todaySeconds = 0;
    for (const s of todaySessions ?? []) {
      todayStudied += s.studied_words || 0;
      todayReviewed += s.reviews_completed || 0;
      todaySeconds += s.study_seconds || 0;
    }

    const data = {
      total_words: stats.totalWords,
      mastered_words: stats.masteredWords,
      learned_words: stats.learnedWords,
      learning_words: stats.learningWords,
      new_words: stats.newWords,
      words_due_today: stats.dueToday,
      words_overdue: stats.overdue,
      streak: profile?.streak || 0,
      longest_streak: profile?.longest_streak || 0,
      daily_goal: profile?.daily_goal || 20,
      today_progress: {
        studied_words: todayStudied,
        reviewed_words: todayReviewed,
        study_minutes: Math.round(todaySeconds / 60),
      },
    };

    return {
      data,
      summary: `Tiến độ: ${stats.masteredWords}/${stats.totalWords} từ đã thuộc (${Math.round((stats.masteredWords / (stats.totalWords || 1)) * 100)}%). Cần ôn hôm nay: ${stats.dueToday} từ (quá hạn: ${stats.overdue}). Streak: ${profile?.streak || 0} ngày.`,
    };
  }

  private async getReviewSchedule(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const days = typeof args.days === "number" && args.days > 0 ? args.days : 7;
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const supabase = await createClient();
    const now = new Date();
    const baseDayStart = new Date(now);
    baseDayStart.setHours(0, 0, 0, 0);

    const stats = await VocabularyStatsService.getUserVocabularyStats(this.userId);

    // If a specific set is requested
    if (setId) {
      const targetRows = stats.rows.filter((r) => r.set_id === setId);
      const set = await VocabSetRepository.getVocabSetById(setId, this.userId);
      const setTitle = set?.title || "Bộ từ đã chọn";

      let setDueToday = 0;
      let setOverdue = 0;
      const dueWords: Array<{ word: string; meaning: string; part_of_speech: string | null; status: string | null; next_review: string | null }> = [];

      for (const row of targetRows) {
        const review = row.review;
        if (!review) continue;
        const classification = classifyForecastRow(
          { next_review: review.next_review ?? null, status: review.status ?? null },
          now
        );
        if (classification === "today") {
          setDueToday += 1;
          if (review.next_review && new Date(review.next_review).getTime() < baseDayStart.getTime()) {
            setOverdue += 1;
          }
          if (dueWords.length < 20) {
            dueWords.push({
              word: row.word,
              meaning: row.meaning,
              part_of_speech: row.part_of_speech,
              status: review.status,
              next_review: review.next_review,
            });
          }
        }
      }

      return {
        data: {
          scope: `Bộ từ cụ thể: '${setTitle}'`,
          set_id: setId,
          set_title: setTitle,
          due_today_count: setDueToday,
          overdue_count: setOverdue,
          sample_due_words: dueWords,
        },
        summary: `Bộ từ '${setTitle}' có ${setDueToday} từ đến hạn ôn (${setOverdue} từ quá hạn).`,
      };
    }

    // Account-wide schedule with set distribution summary
    const { data: userSets } = await supabase
      .from("vocab_sets")
      .select("id, title")
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    const setMap = new Map((userSets ?? []).map((s) => [s.id, s.title]));
    const setDistributionCounts = new Map<string, { title: string; dueCount: number; overdueCount: number }>();

    const sampleDue: Array<{ word: string; meaning: string; set_title: string; status: string | null }> = [];

    for (const row of stats.rows) {
      const review = row.review;
      if (!review) continue;
      const classification = classifyForecastRow(
        { next_review: review.next_review ?? null, status: review.status ?? null },
        now
      );
      if (classification === "today") {
        const isOverdue = review.next_review && new Date(review.next_review).getTime() < baseDayStart.getTime();
        const setTitle = (row.set_id && setMap.get(row.set_id)) || "Chưa xác định";

        const current = setDistributionCounts.get(setTitle) || { title: setTitle, dueCount: 0, overdueCount: 0 };
        current.dueCount += 1;
        if (isOverdue) current.overdueCount += 1;
        setDistributionCounts.set(setTitle, current);

        if (sampleDue.length < 15) {
          sampleDue.push({
            word: row.word,
            meaning: row.meaning,
            set_title: setTitle,
            status: review.status,
          });
        }
      }
    }

    const setsSummary = Array.from(setDistributionCounts.values()).sort((a, b) => b.dueCount - a.dueCount);

    const result = {
      scope: "Toàn bộ tài khoản",
      due_today_count: stats.dueToday,
      overdue_count: stats.overdue,
      sets_distribution_summary: setsSummary,
      forecast_next_days: stats.forecast.days.slice(0, days),
      sample_words_preview: sampleDue,
      important_note:
        "LƯU Ý: Trường 'sample_words_preview' chỉ là danh sách 15 từ mẫu minh họa ngẫu nhiên. TUYỆT ĐỐI KHÔNG dùng danh sách này để suy luận rằng tất cả các từ đến hạn đều thuộc một bộ từ duy nhất. Hãy tham khảo 'sets_distribution_summary' hoặc gọi 'get_srs_sets_distribution' để có bảng phân bố đầy đủ 100%.",
    };

    return {
      data: result,
      summary: `Toàn tài khoản có ${stats.dueToday} từ cần ôn tập (${stats.overdue} từ quá hạn) phân bố ở ${setsSummary.length} bộ từ (${setsSummary.map((s) => `${s.title}: ${s.dueCount} từ`).join(", ")}).`,
    };
  }

  private async getSrsSetsDistribution(): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const stats = await VocabularyStatsService.getUserVocabularyStats(this.userId);
    const now = new Date();

    const baseDayStart = new Date(now);
    baseDayStart.setHours(0, 0, 0, 0);

    // Get all user active sets to map set_id -> set metadata
    const { data: userSets } = await supabase
      .from("vocab_sets")
      .select("id, title, color")
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    const setMap = new Map<string, { id: string; title: string; color: string | null }>();
    for (const s of userSets ?? []) {
      setMap.set(s.id, s);
    }

    const dueGroupMap = new Map<
      string,
      {
        setId: string;
        setTitle: string;
        dueCount: number;
        overdueCount: number;
        dueTodayOnlyCount: number;
        words: string[];
      }
    >();

    let totalDueReviews = 0;
    let totalOverdueReviews = 0;
    let totalDueTodayOnly = 0;
    const uniqueDueWordIds = new Set<string>();
    const uniqueWordSetCount = new Map<string, Set<string>>(); // word -> Set of setIds
    const unassignedWords: string[] = [];

    for (const row of stats.rows) {
      const review = row.review;
      if (!review) continue;

      const classification = classifyForecastRow(
        { next_review: review.next_review ?? null, status: review.status ?? null },
        now
      );

      if (classification === "today") {
        totalDueReviews += 1;
        uniqueDueWordIds.add(row.id);

        const isOverdue =
          review.next_review && new Date(review.next_review).getTime() < baseDayStart.getTime();

        if (isOverdue) {
          totalOverdueReviews += 1;
        } else {
          totalDueTodayOnly += 1;
        }

        const lowerWord = row.word.trim().toLowerCase();
        const existingWordSets = uniqueWordSetCount.get(lowerWord) || new Set<string>();
        if (row.set_id) existingWordSets.add(row.set_id);
        uniqueWordSetCount.set(lowerWord, existingWordSets);

        const targetSet = row.set_id ? setMap.get(row.set_id) : null;
        if (!targetSet) {
          unassignedWords.push(row.word);
          continue;
        }

        const group = dueGroupMap.get(targetSet.id) || {
          setId: targetSet.id,
          setTitle: targetSet.title,
          dueCount: 0,
          overdueCount: 0,
          dueTodayOnlyCount: 0,
          words: [],
        };

        group.dueCount += 1;
        if (isOverdue) {
          group.overdueCount += 1;
        } else {
          group.dueTodayOnlyCount += 1;
        }
        if (group.words.length < 15) {
          group.words.push(row.word);
        }

        dueGroupMap.set(targetSet.id, group);
      }
    }

    // Find words that appear in multiple sets among due words
    const multiSetWords: string[] = [];
    for (const [w, sets] of uniqueWordSetCount.entries()) {
      if (sets.size > 1) multiSetWords.push(w);
    }

    const setsDistribution = Array.from(dueGroupMap.values())
      .sort((a, b) => b.dueCount - a.dueCount)
      .map((g) => ({
        set_id: g.setId,
        set_title: g.setTitle,
        due_count: g.dueCount,
        overdue_count: g.overdueCount,
        due_today_only_count: g.dueTodayOnlyCount,
        percentage_of_all_due:
          totalDueReviews > 0 ? `${Math.round((g.dueCount / totalDueReviews) * 100)}%` : "0%",
        sample_due_words: g.words,
      }));

    const result = {
      data_scope: "Toàn bộ tài khoản (100% cơ sở dữ liệu đã được đối chiếu, không phải dữ liệu mẫu)",
      verified_by_database: true,
      account_totals: {
        total_due_reviews: totalDueReviews,
        total_overdue_reviews: totalOverdueReviews,
        total_due_today_only: totalDueTodayOnly,
        total_unique_due_words: uniqueDueWordIds.size,
        total_sets_with_due_words: setsDistribution.length,
      },
      sets_distribution: setsDistribution,
      unassigned: {
        count: unassignedWords.length,
        sample_words: unassignedWords.slice(0, 10),
      },
      duplicate_words_in_multiple_sets: {
        count: multiSetWords.length,
        words: multiSetWords.slice(0, 10),
      },
      instruction_for_agent:
        "BẮT BUỘC: Khi trả lời, liệt kê rõ từng bộ từ cùng số từ đến hạn/quá hạn tương ứng theo số liệu đã đối chiếu ở trên. Nêu rõ tổng số từ duy nhất và tuyệt đối KHÔNG kết luận toàn bộ từ đến hạn chỉ thuộc một bộ từ duy nhất nếu phân bố có nhiều bộ.",
    };

    const summaryText =
      setsDistribution.length > 0
        ? `Đã phân tích đầy đủ 100%: ${totalDueReviews} từ đến hạn trên toàn tài khoản (${uniqueDueWordIds.size} từ duy nhất) phân bố ở ${setsDistribution.length} bộ từ (${setsDistribution.map((s) => `${s.set_title}: ${s.due_count} từ`).join(", ")}).`
        : `Hiện không có từ nào đến hạn ôn tập trên tài khoản.`;

    return {
      data: result,
      summary: summaryText,
    };
  }

  private async getLearningHistory(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const period = typeof args.period === "string" ? args.period : "week";
    const supabase = await createClient();

    const now = new Date();
    let startDate = new Date();
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(2020, 0, 1);
    }

    const { data: studySessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", this.userId)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false });

    const { data: quizHistory } = await supabase
      .from("quiz_history")
      .select("*")
      .eq("user_id", this.userId)
      .gte("created_at", startDate.toISOString());

    let totalStudied = 0;
    let totalRemembered = 0;
    let totalStudySeconds = 0;
    let totalReviewsCompleted = 0;

    for (const s of studySessions ?? []) {
      totalStudied += s.studied_words || 0;
      totalRemembered += s.remembered_words || 0;
      totalStudySeconds += s.study_seconds || 0;
      totalReviewsCompleted += s.reviews_completed || 0;
    }

    let totalQuestions = 0;
    let totalCorrectAnswers = 0;
    for (const q of quizHistory ?? []) {
      totalQuestions += q.total_questions || 0;
      totalCorrectAnswers += q.correct_answers || 0;
    }

    const quizAccuracy =
      totalQuestions > 0 ? Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;

    const result = {
      period,
      sessions_count: (studySessions ?? []).length,
      words_studied: totalStudied,
      words_remembered: totalRemembered,
      reviews_completed: totalReviewsCompleted,
      study_minutes: Math.round(totalStudySeconds / 60),
      quiz_count: (quizHistory ?? []).length,
      quiz_total_questions: totalQuestions,
      quiz_accuracy_percent: quizAccuracy,
    };

    return {
      data: result,
      summary: `Trong ${period === "today" ? "hôm nay" : period === "week" ? "tuần này" : "tháng này"}, bạn đã học ${totalStudied} từ, ôn tập ${totalReviewsCompleted} lượt, tổng thời gian học ${Math.round(totalStudySeconds / 60)} phút. Tỷ lệ chính xác quiz: ${quizAccuracy}%.`,
    };
  }

  private async getFrequentlyIncorrectWords(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 10;
    const supabase = await createClient();

    // Query recent learning sessions answers_history
    const { data: sessions, error } = await supabase
      .from("learning_sessions")
      .select("answers_history")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const wrongCounts = new Map<string, { wrong: number; total: number }>();

    for (const s of sessions ?? []) {
      if (Array.isArray(s.answers_history)) {
        for (const ans of s.answers_history as Array<{ vocabularyId?: string; isCorrect?: boolean }>) {
          if (ans?.vocabularyId) {
            const current = wrongCounts.get(ans.vocabularyId) || { wrong: 0, total: 0 };
            current.total += 1;
            if (!ans.isCorrect) {
              current.wrong += 1;
            }
            wrongCounts.set(ans.vocabularyId, current);
          }
        }
      }
    }

    // Filter vocabularies that have wrong answers
    const topWrongVocabIds = Array.from(wrongCounts.entries())
      .filter(([, stats]) => stats.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .slice(0, limit);

    if (topWrongVocabIds.length === 0) {
      // Fallback: check reviews with last_grade = 'again' or level 1
      const { data: reviewsAgain } = await supabase
        .from("reviews")
        .select("vocabulary_id, status, last_grade, vocabularies!inner(word, meaning, part_of_speech)")
        .eq("user_id", this.userId)
        .or("last_grade.eq.again,status.eq.learning,status.eq.lv1")
        .limit(limit);

      const fallbackList = (reviewsAgain ?? []).map((r) => {
        const vocab = Array.isArray(r.vocabularies) ? r.vocabularies[0] : r.vocabularies;
        return {
          word: vocab?.word || "Unknown",
          meaning: vocab?.meaning || "",
          part_of_speech: vocab?.part_of_speech || "",
          reason: r.last_grade === "again" ? "Vừa đánh giá 'Chưa nhớ' (Again)" : "Đang ở cấp độ làm quen (Level 1)",
        };
      });

      return {
        data: {
          count: fallbackList.length,
          words: fallbackList,
        },
        summary: fallbackList.length > 0
          ? `Tìm thấy ${fallbackList.length} từ bạn đang cần lưu ý củng cố thêm.`
          : `Tuyệt vời! Bạn không có từ nào bị trả lời sai nhiều lần.`,
      };
    }

    // Fetch word details
    const vocabIds = topWrongVocabIds.map(([id]) => id);
    const { data: vocabRows } = await supabase
      .from("vocabularies")
      .select("id, word, meaning, part_of_speech, difficulty, vocab_sets!inner(title)")
      .in("id", vocabIds);

    const vocabMap = new Map((vocabRows ?? []).map((v) => [v.id, v]));

    const detailedList = topWrongVocabIds.map(([id, stats]) => {
      const v = vocabMap.get(id);
      const set = Array.isArray(v?.vocab_sets) ? v?.vocab_sets[0] : v?.vocab_sets;
      const errorRate = Math.round((stats.wrong / stats.total) * 100);
      return {
        id,
        word: v?.word || "Unknown",
        meaning: v?.meaning || "",
        part_of_speech: v?.part_of_speech || "",
        set_title: set?.title || "Không xác định",
        wrong_count: stats.wrong,
        total_attempts: stats.total,
        error_rate_percent: errorRate,
      };
    });

    return {
      data: {
        count: detailedList.length,
        words: detailedList,
      },
      summary: `Top ${detailedList.length} từ bạn hay trả lời sai nhất: ${detailedList.map((w) => `${w.word} (sai ${w.wrong_count} lần)`).join(", ")}.`,
    };
  }

  private async getSetsLearningComparison(): Promise<ToolExecutionResult> {
    const { data: sets } = await VocabSetRepository.getVocabSets(this.userId, { limit: 100 });
    const summaries = await VocabSetSummaryService.getUserVocabSetSummaries(this.userId);

    const enriched = sets.map((s) => {
      const sum = summaries[s.id] || {
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        lastStudiedAt: null,
      };
      const masteryPercent =
        sum.totalWords > 0 ? Math.round((sum.masteredWords / sum.totalWords) * 100) : 0;
      return {
        id: s.id,
        title: s.title,
        total_words: sum.totalWords,
        unlearned_words: sum.newWords,
        learning_words: sum.learningWords,
        mastered_words: sum.masteredWords,
        mastery_percent: masteryPercent,
      };
    });

    if (enriched.length === 0) {
      return {
        data: { message: "Bạn chưa có bộ từ nào." },
        summary: "Không có bộ từ nào để so sánh.",
      };
    }

    const mostUnlearned = [...enriched].sort((a, b) => b.unlearned_words - a.unlearned_words)[0];
    const highestMastery = [...enriched].sort((a, b) => b.mastery_percent - a.mastery_percent)[0];

    const result = {
      sets_comparison: enriched,
      set_with_most_unlearned: mostUnlearned,
      set_with_highest_mastery: highestMastery,
    };

    return {
      data: result,
      summary: `Bộ từ có nhiều từ chưa học nhất là '${mostUnlearned?.title}' (${mostUnlearned?.unlearned_words} từ chưa học). Bộ từ có tỷ lệ thuộc cao nhất là '${highestMastery?.title}' (${highestMastery?.mastery_percent}% đã thuộc).`,
    };
  }

  // ==========================================
  // SAFE WRITE ACTIONS
  // ==========================================

  private async createVocabSet(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const title = typeof args.title === "string" ? args.title.trim() : "";
    if (!title) {
      return { error: "Tên bộ từ không được để trống.", summary: "Thiếu tên bộ từ." };
    }

    const description = typeof args.description === "string" ? args.description.trim() : null;
    const sourceLanguage = typeof args.source_language === "string" ? args.source_language.trim() : "en";
    const targetLanguage = typeof args.target_language === "string" ? args.target_language.trim() : "vi";

    const newId = generateVocabSetId();
    const color = getRandomVocabularySetColor();

    const created = await VocabSetRepository.createVocabSet(newId, this.userId, {
      title,
      description,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      color,
      icon: "BookOpen",
      visibility: "private",
      source: "ai_assistant",
    });

    revalidatePath("/u/vocabulary");
    revalidatePath("/u/vocabulary-management");
    revalidatePath("/u");

    return {
      data: {
        id: created.id,
        title: created.title,
        description: created.description,
        created_at: created.created_at,
      },
      summary: `Đã tạo thành công bộ từ mới: '${created.title}' (ID: ${created.id}).`,
    };
  }

  private async renameVocabSet(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const currentTitle = typeof args.current_title === "string" ? args.current_title.trim() : null;
    const newTitle = typeof args.new_title === "string" ? args.new_title.trim() : "";
    const newDescription = typeof args.new_description === "string" ? args.new_description.trim() : undefined;

    if (!newTitle) {
      return { error: "Tên mới không được để trống.", summary: "Thiếu tên mới." };
    }

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (currentTitle) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${currentTitle}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: `Không tìm thấy bộ từ cần đổi tên: ${setId || currentTitle}.`,
        summary: "Bộ từ không tồn tại hoặc không thuộc quyền sở hữu của bạn.",
      };
    }

    const updates: Database["public"]["Tables"]["vocab_sets"]["Update"] = {
      title: newTitle,
      updated_at: new Date().toISOString(),
    };
    if (newDescription !== undefined) {
      updates.description = newDescription;
    }

    const updated = await VocabSetRepository.updateVocabSet(targetSet.id, this.userId, updates);

    revalidatePath("/u/vocabulary");
    revalidatePath("/u/vocabulary-management");

    return {
      data: {
        id: updated.id,
        old_title: targetSet.title,
        new_title: updated.title,
      },
      summary: `Đã đổi tên bộ từ từ '${targetSet.title}' thành '${updated.title}'.`,
    };
  }

  private async addVocabulary(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;
    const word = typeof args.word === "string" ? args.word.trim() : "";
    const meaning = typeof args.meaning === "string" ? args.meaning.trim() : "";

    if (!word || !meaning) {
      return { error: "Từ tiếng Anh và nghĩa tiếng Việt không được để trống.", summary: "Thiếu từ hoặc nghĩa." };
    }

    // Resolve target set
    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    } else {
      // If no set specified, pick the most recently updated set
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: "Không tìm thấy bộ từ vựng mục tiêu. Vui lòng tạo bộ từ trước hoặc chỉ định tên bộ từ cụ thể.",
        summary: "Không xác định được bộ từ để thêm.",
      };
    }

    // Check duplicate in this set
    const { data: existing } = await supabase
      .from("vocabularies")
      .select("id, word")
      .eq("set_id", targetSet.id)
      .eq("owner_id", this.userId)
      .ilike("word", word)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      return {
        error: `Từ '${word}' đã tồn tại trong bộ từ '${targetSet.title}'.`,
        summary: `Từ '${word}' đã có sẵn trong bộ từ.`,
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("vocabularies")
      .insert({
        set_id: targetSet.id,
        owner_id: this.userId,
        word,
        meaning,
        ipa: typeof args.ipa === "string" ? args.ipa.trim() : null,
        part_of_speech: typeof args.part_of_speech === "string" ? args.part_of_speech.trim() : null,
        example: typeof args.example === "string" ? args.example.trim() : null,
        example_translation: typeof args.example_translation === "string" ? args.example_translation.trim() : null,
        difficulty: typeof args.difficulty === "string" ? args.difficulty.trim().toUpperCase() : null,
        note: typeof args.note === "string" ? args.note.trim() : null,
        source: "ai_assistant",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    revalidatePath(`/u/vocabulary/${targetSet.id}`);
    revalidatePath("/u/vocabulary");
    revalidatePath("/u/statistics");

    return {
      data: {
        id: inserted.id,
        word: inserted.word,
        meaning: inserted.meaning,
        set_id: targetSet.id,
        set_title: targetSet.title,
      },
      summary: `Đã thêm thành công từ '${inserted.word}' (${inserted.meaning}) vào bộ từ '${targetSet.title}'.`,
    };
  }

  private async bulkAddVocabulary(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;
    const wordsInput = Array.isArray(args.words) ? args.words : [];

    if (wordsInput.length === 0) {
      return { error: "Danh sách từ vựng trống.", summary: "Không có từ nào để thêm." };
    }

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: "Không tìm thấy bộ từ vựng mục tiêu.",
        summary: "Không xác định được bộ từ.",
      };
    }

    // Check existing words in this set to avoid duplicate additions
    const { data: existingWords } = await supabase
      .from("vocabularies")
      .select("word")
      .eq("set_id", targetSet.id)
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    const existingSet = new Set((existingWords ?? []).map((w) => w.word.trim().toLowerCase()));

    const toInsert: Database["public"]["Tables"]["vocabularies"]["Insert"][] = [];
    const duplicatesSkipped: string[] = [];

    for (const item of wordsInput) {
      const w = typeof item?.word === "string" ? item.word.trim() : "";
      const m = typeof item?.meaning === "string" ? item.meaning.trim() : "";
      if (!w || !m) continue;

      if (existingSet.has(w.toLowerCase())) {
        duplicatesSkipped.push(w);
        continue;
      }

      existingSet.add(w.toLowerCase());
      toInsert.push({
        set_id: targetSet.id,
        owner_id: this.userId,
        word: w,
        meaning: m,
        ipa: typeof item.ipa === "string" ? item.ipa.trim() : null,
        part_of_speech: typeof item.part_of_speech === "string" ? item.part_of_speech.trim() : null,
        example: typeof item.example === "string" ? item.example.trim() : null,
        example_translation: typeof item.example_translation === "string" ? item.example_translation.trim() : null,
        difficulty: typeof item.difficulty === "string" ? item.difficulty.trim().toUpperCase() : null,
        note: typeof item.note === "string" ? item.note.trim() : null,
        source: "ai_assistant_bulk",
      });
    }

    if (toInsert.length > 0) {
      await VocabularyRepository.bulkInsert(toInsert);
    }

    revalidatePath(`/u/vocabulary/${targetSet.id}`);
    revalidatePath("/u/vocabulary");
    revalidatePath("/u/statistics");

    return {
      data: {
        set_id: targetSet.id,
        set_title: targetSet.title,
        added_count: toInsert.length,
        skipped_duplicate_count: duplicatesSkipped.length,
        skipped_words: duplicatesSkipped,
      },
      summary: `Đã thêm ${toInsert.length} từ vào bộ '${targetSet.title}'.${
        duplicatesSkipped.length > 0 ? ` (Bỏ qua ${duplicatesSkipped.length} từ trùng: ${duplicatesSkipped.join(", ")})` : ""
      }`,
    };
  }

  private async updateVocabulary(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const vocabId = typeof args.vocabulary_id === "string" ? args.vocabulary_id.trim() : null;
    const word = typeof args.word === "string" ? args.word.trim() : null;
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const updates = (args.updates as Record<string, unknown>) || {};

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, set_id, vocab_sets!inner(title)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    if (vocabId) {
      dbQuery = dbQuery.eq("id", vocabId);
    } else if (word) {
      dbQuery = dbQuery.ilike("word", word);
      if (setId) dbQuery = dbQuery.eq("set_id", setId);
    } else {
      return { error: "Thiếu thông tin từ vựng cần sửa.", summary: "Thiếu ID hoặc từ tiếng Anh." };
    }

    const { data: targetVocab, error: fetchErr } = await dbQuery.limit(1).maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!targetVocab) {
      return {
        error: `Không tìm thấy từ vựng '${word || vocabId}' trong kho của bạn.`,
        summary: "Từ vựng không tồn tại.",
      };
    }

    const payload: Database["public"]["Tables"]["vocabularies"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (typeof updates.meaning === "string") payload.meaning = updates.meaning.trim();
    if (typeof updates.ipa === "string") payload.ipa = updates.ipa.trim();
    if (typeof updates.part_of_speech === "string") payload.part_of_speech = updates.part_of_speech.trim();
    if (typeof updates.example === "string") payload.example = updates.example.trim();
    if (typeof updates.example_translation === "string") payload.example_translation = updates.example_translation.trim();
    if (typeof updates.difficulty === "string") payload.difficulty = updates.difficulty.trim().toUpperCase();
    if (typeof updates.note === "string") payload.note = updates.note.trim();

    const { data: updated, error: updateErr } = await supabase
      .from("vocabularies")
      .update(payload)
      .eq("id", targetVocab.id)
      .eq("owner_id", this.userId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    revalidatePath(`/u/vocabulary/${targetVocab.set_id}`);

    return {
      data: {
        id: updated.id,
        word: updated.word,
        meaning: updated.meaning,
        updated_fields: Object.keys(updates),
      },
      summary: `Đã cập nhật thành công thông tin từ '${updated.word}'.`,
    };
  }

  // ==========================================
  // DESTRUCTIVE ACTION PREPARATION (CONFIRMATION)
  // ==========================================

  private async prepareDeleteVocabSet(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: `Không tìm thấy bộ từ '${setName || setId}' để xóa.`,
        summary: "Bộ từ không tồn tại hoặc không thuộc quyền sở hữu của bạn.",
      };
    }

    // Count affected vocabularies and sessions
    const { count: vocabCount } = await supabase
      .from("vocabularies")
      .select("id", { count: "exact", head: true })
      .eq("set_id", targetSet.id)
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    const token = generateConfirmationToken("delete_vocab_set", targetSet.id, this.userId);

    const confirmation: PendingConfirmation = {
      id: `conf_${Date.now()}`,
      action: "delete_vocab_set",
      title: "Xác nhận xóa bộ từ vựng",
      targetId: targetSet.id,
      targetName: targetSet.title,
      affectedSummary: `1 bộ từ vựng ('${targetSet.title}') và ${vocabCount || 0} từ liên quan`,
      deletedSummary: `Bộ từ '${targetSet.title}', toàn bộ ${vocabCount || 0} từ vựng bên trong và tiến trình ôn tập SRS liên quan`,
      retainedSummary: "Không có (bộ từ sẽ bị xóa hoàn toàn khỏi tài khoản)",
      token,
      status: "pending",
    };

    return {
      confirmation,
      summary: `Đã chuẩn bị yêu cầu xóa bộ từ '${targetSet.title}' (${vocabCount || 0} từ). Chờ người dùng xác nhận.`,
    };
  }

  private async prepareDeleteVocabulary(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const vocabId = typeof args.vocabulary_id === "string" ? args.vocabulary_id.trim() : null;
    const word = typeof args.word === "string" ? args.word.trim() : null;
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, meaning, set_id, vocab_sets!inner(title)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    if (vocabId) {
      dbQuery = dbQuery.eq("id", vocabId);
    } else if (word) {
      dbQuery = dbQuery.ilike("word", word);
      if (setId) dbQuery = dbQuery.eq("set_id", setId);
    } else {
      return { error: "Thiếu thông tin từ vựng cần xóa.", summary: "Thiếu từ hoặc ID." };
    }

    const { data: targetVocab, error } = await dbQuery.limit(1).maybeSingle();
    if (error) throw error;

    if (!targetVocab) {
      return {
        error: `Không tìm thấy từ vựng '${word || vocabId}' để xóa.`,
        summary: "Từ vựng không tồn tại.",
      };
    }

    const set = Array.isArray(targetVocab.vocab_sets) ? targetVocab.vocab_sets[0] : targetVocab.vocab_sets;
    const token = generateConfirmationToken("delete_vocabulary", targetVocab.id, this.userId);

    const confirmation: PendingConfirmation = {
      id: `conf_${Date.now()}`,
      action: "delete_vocabulary",
      title: "Xác nhận xóa từ vựng",
      targetId: targetVocab.id,
      targetName: targetVocab.word,
      affectedSummary: `1 từ vựng: '${targetVocab.word}' (${targetVocab.meaning})`,
      deletedSummary: `Từ '${targetVocab.word}' trong bộ '${set?.title || "Từ vựng"}' và dữ liệu ôn tập SRS của từ này`,
      retainedSummary: `Tất cả các từ vựng khác trong bộ '${set?.title || "Từ vựng"}' vẫn được giữ nguyên`,
      token,
      status: "pending",
    };

    return {
      confirmation,
      summary: `Đã chuẩn bị yêu cầu xóa từ '${targetVocab.word}'. Chờ người dùng xác nhận.`,
    };
  }

  private async prepareResetVocabSetProgress(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: `Không tìm thấy bộ từ '${setName || setId}' để reset tiến trình.`,
        summary: "Bộ từ không tồn tại.",
      };
    }

    const { count: vocabCount } = await supabase
      .from("vocabularies")
      .select("id", { count: "exact", head: true })
      .eq("set_id", targetSet.id)
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    const token = generateConfirmationToken("reset_vocab_set_progress", targetSet.id, this.userId);

    const confirmation: PendingConfirmation = {
      id: `conf_${Date.now()}`,
      action: "reset_vocab_set_progress",
      title: "Xác nhận reset tiến trình học tập bộ từ",
      targetId: targetSet.id,
      targetName: targetSet.title,
      affectedSummary: `Tiến trình SRS của toàn bộ ${vocabCount || 0} từ trong bộ '${targetSet.title}'`,
      deletedSummary: `Cấp độ thuộc (Mastery), khoảng cách ngày ôn (SRS Interval) và trạng thái ôn tập sẽ được đưa về MỚI (chưa học)`,
      retainedSummary: `Bộ từ '${targetSet.title}' và toàn bộ danh sách ${vocabCount || 0} từ vựng vẫn được GIỮ NGUYÊN HOÀN TOÀN`,
      token,
      status: "pending",
    };

    return {
      confirmation,
      summary: `Đã chuẩn bị yêu cầu reset tiến trình học bộ '${targetSet.title}'. Chờ người dùng xác nhận.`,
    };
  }

  private async prepareDeleteVocabSetLearningHistory(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const setId = typeof args.set_id === "string" ? args.set_id.trim() : null;
    const setName = typeof args.set_name === "string" ? args.set_name.trim() : null;

    let targetSet: Database["public"]["Tables"]["vocab_sets"]["Row"] | null = null;
    if (setId) {
      targetSet = await VocabSetRepository.getVocabSetById(setId, this.userId);
    } else if (setName) {
      const { data } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .ilike("title", `%${setName}%`)
        .limit(1)
        .maybeSingle();
      targetSet = data;
    }

    if (!targetSet) {
      return {
        error: `Không tìm thấy bộ từ '${setName || setId}' để xóa lịch sử học.`,
        summary: "Bộ từ không tồn tại.",
      };
    }

    const { count: sessionCount } = await supabase
      .from("learning_sessions")
      .select("id", { count: "exact", head: true })
      .eq("vocabulary_set_id", targetSet.id)
      .eq("user_id", this.userId);

    const token = generateConfirmationToken("delete_vocab_set_learning_history", targetSet.id, this.userId);

    const confirmation: PendingConfirmation = {
      id: `conf_${Date.now()}`,
      action: "delete_vocab_set_learning_history",
      title: "Xác nhận xóa lịch sử phiên học của bộ từ",
      targetId: targetSet.id,
      targetName: targetSet.title,
      affectedSummary: `${sessionCount || 0} phiên học và câu trả lời trong quá khứ của bộ '${targetSet.title}'`,
      deletedSummary: `Lịch sử làm bài tập trắc nghiệm ngữ cảnh, điểm số và chuỗi streak các phiên học cũ`,
      retainedSummary: `Bộ từ, danh sách từ vựng và cấp độ SRS hiện tại của từng từ vẫn được GIỮ NGUYÊN`,
      token,
      status: "pending",
    };

    return {
      confirmation,
      summary: `Đã chuẩn bị yêu cầu xóa lịch sử học của bộ '${targetSet.title}'. Chờ người dùng xác nhận.`,
    };
  }

  private async prepareResetSingleVocabularyProgress(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const supabase = await createClient();
    const vocabId = typeof args.vocabulary_id === "string" ? args.vocabulary_id.trim() : null;
    const word = typeof args.word === "string" ? args.word.trim() : null;

    let dbQuery = supabase
      .from("vocabularies")
      .select("id, word, meaning, set_id, vocab_sets!inner(title)")
      .eq("owner_id", this.userId)
      .is("deleted_at", null);

    if (vocabId) {
      dbQuery = dbQuery.eq("id", vocabId);
    } else if (word) {
      dbQuery = dbQuery.ilike("word", word);
    } else {
      return { error: "Thiếu thông tin từ vựng cần reset tiến trình.", summary: "Thiếu từ hoặc ID." };
    }

    const { data: targetVocab, error } = await dbQuery.limit(1).maybeSingle();
    if (error) throw error;

    if (!targetVocab) {
      return {
        error: `Không tìm thấy từ '${word || vocabId}'.`,
        summary: "Từ vựng không tồn tại.",
      };
    }

    const token = generateConfirmationToken("reset_single_vocabulary_progress", targetVocab.id, this.userId);

    const confirmation: PendingConfirmation = {
      id: `conf_${Date.now()}`,
      action: "reset_single_vocabulary_progress",
      title: "Xác nhận reset tiến trình của từ",
      targetId: targetVocab.id,
      targetName: targetVocab.word,
      affectedSummary: `Tiến trình SRS của từ '${targetVocab.word}' (${targetVocab.meaning})`,
      deletedSummary: `Cấp độ thuộc, lịch ôn tập tiếp theo và số lần ôn của từ này sẽ trở về 0 (chưa học)`,
      retainedSummary: `Từ '${targetVocab.word}' vẫn nằm nguyên trong bộ từ của bạn`,
      token,
      status: "pending",
    };

    return {
      confirmation,
      summary: `Đã chuẩn bị yêu cầu reset tiến trình từ '${targetVocab.word}'. Chờ người dùng xác nhận.`,
    };
  }
}

/**
 * Executes a confirmed destructive action after user validation.
 */
export async function executeConfirmedAction(
  userId: string,
  action: DestructiveActionType,
  targetId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  switch (action) {
    case "delete_vocab_set": {
      // Check ownership
      const set = await VocabSetRepository.getVocabSetById(targetId, userId);
      if (!set) throw new Error("Bộ từ không tồn tại hoặc bạn không có quyền xóa.");
      await VocabSetRepository.deleteVocabSetCascade(targetId, userId);
      revalidatePath("/u/vocabulary");
      revalidatePath("/u/vocabulary-management");
      revalidatePath("/u");
      revalidatePath("/u/statistics");
      return {
        success: true,
        message: `Đã xóa thành công bộ từ '${set.title}' và các từ vựng liên quan khỏi tài khoản.`,
      };
    }

    case "delete_vocabulary": {
      const { data: vocab } = await supabase
        .from("vocabularies")
        .select("id, word, set_id")
        .eq("id", targetId)
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!vocab) throw new Error("Từ vựng không tồn tại hoặc bạn không có quyền xóa.");
      await VocabularyRepository.softDelete(targetId, userId);
      revalidatePath(`/u/vocabulary/${vocab.set_id}`);
      revalidatePath("/u/vocabulary");
      revalidatePath("/u/statistics");
      return {
        success: true,
        message: `Đã xóa thành công từ '${vocab.word}' khỏi bộ từ.`,
      };
    }

    case "reset_vocab_set_progress": {
      const set = await VocabSetRepository.getVocabSetById(targetId, userId);
      if (!set) throw new Error("Bộ từ không tồn tại.");

      // Find all vocabularies in this set
      const { data: vocabs } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("set_id", targetId)
        .eq("owner_id", userId)
        .is("deleted_at", null);

      const vocabIds = (vocabs ?? []).map((v) => v.id);
      if (vocabIds.length > 0) {
        // Delete or reset reviews
        await supabase
          .from("reviews")
          .delete()
          .eq("user_id", userId)
          .in("vocabulary_id", vocabIds);
      }

      revalidatePath(`/u/vocabulary/${targetId}`);
      revalidatePath("/u/review");
      revalidatePath("/u/statistics");
      return {
        success: true,
        message: `Đã reset toàn bộ tiến trình học tập của ${vocabIds.length} từ trong bộ '${set.title}'. Tất cả từ đã trở về trạng thái chưa học.`,
      };
    }

    case "delete_vocab_set_learning_history": {
      const set = await VocabSetRepository.getVocabSetById(targetId, userId);
      if (!set) throw new Error("Bộ từ không tồn tại.");

      await supabase
        .from("learning_sessions")
        .delete()
        .eq("vocabulary_set_id", targetId)
        .eq("user_id", userId);

      await supabase
        .from("sentence_practice_history")
        .delete()
        .eq("vocab_set_id", targetId)
        .eq("user_id", userId);

      revalidatePath(`/u/vocabulary/${targetId}`);
      revalidatePath("/u/statistics");
      return {
        success: true,
        message: `Đã xóa sạch lịch sử phiên học và bài tập của bộ '${set.title}'.`,
      };
    }

    case "reset_single_vocabulary_progress": {
      const { data: vocab } = await supabase
        .from("vocabularies")
        .select("id, word, set_id")
        .eq("id", targetId)
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!vocab) throw new Error("Từ vựng không tồn tại.");

      await supabase
        .from("reviews")
        .delete()
        .eq("user_id", userId)
        .eq("vocabulary_id", targetId);

      revalidatePath(`/u/vocabulary/${vocab.set_id}`);
      revalidatePath("/u/review");
      revalidatePath("/u/statistics");
      return {
        success: true,
        message: `Đã reset tiến trình của từ '${vocab.word}' về trạng thái ban đầu.`,
      };
    }

    default:
      throw new Error(`Thao tác không hợp lệ.`);
  }
}
