// src/lib/ai/agent/__tests__/phase1-read.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentToolExecutor } from "../tools";

const { mockSets, mockVocabs, capturedFilters } = vi.hoisted(() => {
  const mockSets = [
    {
      id: "vs_IELTS01",
      user_id: "user-owner-1",
      title: "IELTS Academic",
      description: "Core academic words",
      source_language: "en",
      target_language: "vi",
      color: "blue",
      icon: "BookOpen",
      visibility: "private",
      source: "manual",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-20T00:00:00Z",
      last_studied_at: "2026-11-20T00:00:00Z",
      deleted_at: null,
    },
    {
      id: "vs_WORK02",
      user_id: "user-owner-1",
      title: "Business English",
      description: "Office terms",
      source_language: "en",
      target_language: "vi",
      color: "emerald",
      icon: "BookOpen",
      visibility: "private",
      source: "manual",
      created_at: "2026-11-02T00:00:00Z",
      updated_at: "2026-11-18T00:00:00Z",
      last_studied_at: null,
      deleted_at: null,
    },
  ];

  // Notice: "resilient" appears in BOTH sets -> 3 word records, 2 unique normalized words!
  const mockVocabs = [
    {
      id: "w-1",
      set_id: "vs_IELTS01",
      owner_id: "user-owner-1",
      word: "resilient",
      ipa: "/rɪˈzɪl.i.ənt/",
      part_of_speech: "adjective",
      meaning: "kiên cường, phục hồi nhanh",
      example: "She remained resilient under pressure.",
      example_translation: "Cô ấy vẫn kiên cường dưới áp lực.",
      synonyms: ["tough", "adaptable"],
      antonyms: ["fragile"],
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "hard",
      source: "manual",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      deleted_at: null,
      fts_vector: null,
      is_starred: true,
      vocab_sets: { id: "vs_IELTS01", title: "IELTS Academic", deleted_at: null },
      review: {
        id: "rev-1",
        user_id: "user-owner-1",
        vocabulary_id: "w-1",
        status: "lv5",
        next_review: null,
        last_review: "2026-11-20T00:00:00Z",
        last_grade: "good",
        ease_factor: 2.5,
        interval: 7,
        repetitions: 3,
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-20T00:00:00Z",
      },
    },
    {
      id: "w-2",
      set_id: "vs_IELTS01",
      owner_id: "user-owner-1",
      word: "mitigate",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
      part_of_speech: "verb",
      meaning: "giảm nhẹ",
      example: "New rules help mitigate risk.",
      example_translation: null,
      synonyms: ["alleviate"],
      antonyms: ["aggravate"],
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "medium",
      source: "manual",
      created_at: "2026-11-02T00:00:00Z",
      updated_at: "2026-11-02T00:00:00Z",
      deleted_at: null,
      fts_vector: null,
      is_starred: false,
      vocab_sets: { id: "vs_IELTS01", title: "IELTS Academic", deleted_at: null },
      review: {
        id: "rev-2",
        user_id: "user-owner-1",
        vocabulary_id: "w-2",
        status: "lv2",
        next_review: "2020-01-01T00:00:00Z",
        last_review: "2020-01-01T00:00:00Z",
        last_grade: "again",
        ease_factor: 2.1,
        interval: 1,
        repetitions: 1,
        created_at: "2026-11-02T00:00:00Z",
        updated_at: "2026-11-02T00:00:00Z",
      },
    },
    {
      id: "w-3",
      set_id: "vs_WORK02",
      owner_id: "user-owner-1",
      word: "Resilient ",
      ipa: "/rɪˈzɪl.i.ənt/",
      part_of_speech: "adjective",
      meaning: "bền bỉ",
      example: null,
      example_translation: null,
      synonyms: [],
      antonyms: [],
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "hard",
      source: "manual",
      created_at: "2026-11-03T00:00:00Z",
      updated_at: "2026-11-03T00:00:00Z",
      deleted_at: null,
      fts_vector: null,
      is_starred: false,
      vocab_sets: { id: "vs_WORK02", title: "Business English", deleted_at: null },
      review: null,
    },
  ];

  const capturedFilters: Array<{ table: string; col: string; val: unknown }> = [];
  return { mockSets, mockVocabs, capturedFilters };
});

function createChainMock(table: string, capturedFilters: Array<{ table: string; col: string; val: unknown }>) {
  const rows =
    table === "vocab_sets"
      ? mockSets
      : table === "vocabularies"
      ? mockVocabs
      : table === "sentence_practice_history"
      ? [{ vocab_id: "w-2", overall_score: 40, used_correctly: false }]
      : table === "learning_sessions"
      ? [{ answers_history: [{ vocabularyId: "w-2", isCorrect: false }], word_states: {} }]
      : [];

  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      capturedFilters.push({ table, col, val });
      return chain;
    },
    is: () => chain,
    gte: () => chain,
    lt: () => chain,
    not: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: rows, error: null }),
    range: () => Promise.resolve({ data: rows, error: null }),
    maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    then: (resolve: (val: unknown) => void) => resolve({ data: rows, error: null, count: rows.length }),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: (table: string) => createChainMock(table, capturedFilters),
  })),
}));

vi.mock("@/lib/statistics/vocab-set-summary.service", () => ({
  VocabSetSummaryService: {
    getUserVocabSetSummaries: vi.fn().mockResolvedValue({
      vs_IELTS01: {
        setId: "vs_IELTS01",
        totalWords: 2,
        masteredWords: 1,
        learningWords: 1,
        newWords: 0,
        lastStudiedAt: "2026-11-20T00:00:00Z",
      },
      vs_WORK02: {
        setId: "vs_WORK02",
        totalWords: 1,
        masteredWords: 0,
        learningWords: 0,
        newWords: 1,
        lastStudiedAt: null,
      },
    }),
  },
}));

vi.mock("@/lib/statistics/vocabulary-stats.service", () => ({
  VocabularyStatsService: {
    getUserVocabularyStats: vi.fn().mockResolvedValue({
      totalWords: 3,
      newWords: 1,
      learningWords: 0,
      learnedWords: 1,
      masteredWords: 1,
      dueToday: 1,
      overdue: 1,
      forecast: { total: 1, averagePerDay: 0.1, busiestDay: null, days: [] },
      rows: mockVocabs,
    }),
  },
}));

vi.mock("@/repositories/review.repository", () => ({
  ReviewRepository: {
    getDueReviews: vi.fn().mockResolvedValue([
      {
        review: mockVocabs[1].review,
        vocabulary: mockVocabs[1],
      },
    ]),
    getDueReviewsBySetId: vi.fn().mockResolvedValue([
      {
        review: mockVocabs[1].review,
        vocabulary: mockVocabs[1],
      },
    ]),
  },
}));

vi.mock("@/repositories/statistics.repository", () => ({
  StatisticsRepository: {
    getDashboardStats: vi.fn().mockResolvedValue({
      totalSets: 2,
      totalWords: 3,
      dashboardVocabularyStats: {
        totalWords: 3,
        newWords: 1,
        learningWords: 0,
        learnedWords: 1,
        masteredWords: 1,
        dueToday: 1,
        overdue: 1,
        forecast: { total: 1, averagePerDay: 0.1, busiestDay: null, days: [] },
        rows: mockVocabs,
      },
      masteredWords: 1,
      learningWords: 0,
      todayReviewCount: 1,
      streak: 4,
      dailyProgress: { studiedWords: 5, reviewedWords: 2, goal: 20, progressPercent: 35 },
      weeklyActivity: [],
      todaySummary: {
        studiedWords: 5,
        reviewedWords: 2,
        studySeconds: 300,
        quizzesCompleted: 1,
        dictationsCompleted: 0,
        sentencesCompleted: 1,
      },
    }),
  },
}));

describe("Phase 1 – Read-Only Database Intelligence", () => {
  let executor = new AgentToolExecutor("user-owner-1");

  beforeEach(() => {
    capturedFilters.length = 0;
    executor = new AgentToolExecutor("user-owner-1");
  });

  it("lists, searches, retrieves, and counts vocabulary sets accurately", async () => {
    const listRes = await executor.execute("list_vocabulary_sets", {});
    const listData = listRes.data as { totalSets: number; sets: Array<{ title: string }> };
    expect(listData.totalSets).toBe(2);
    expect(listData.sets.map((s) => s.title)).toContain("IELTS Academic");

    const searchRes = await executor.execute("search_vocabulary_sets", { query: "ielts" });
    expect((searchRes.data as { totalMatches: number }).totalMatches).toBe(1);

    const getRes = await executor.execute("get_vocabulary_set", { set_title: "IELTS Academic" });
    const getData = getRes.data as {
      scope: string;
      aggregationMetadata: { totalWordsInSet: number };
    };
    expect(getData.scope).toBe("single_set");
    expect(getData.aggregationMetadata.totalWordsInSet).toBe(2);

    const countRes = await executor.execute("count_vocabulary_sets", {});
    expect((countRes.data as { totalSets: number }).totalSets).toBe(2);
  });

  it("distinguishes total word records from unique normalized words across sets", async () => {
    const countRes = await executor.execute("count_vocabulary_words", {});
    const data = countRes.data as {
      totalWordRecords: number;
      uniqueWordCount: number;
      scope: string;
    };
    expect(data.scope).toBe("account_wide_active");
    expect(data.totalWordRecords).toBe(3);
    expect(data.uniqueWordCount).toBe(2);
  });

  it("searches and retrieves word details including IPA, meaning, and examples", async () => {
    const searchRes = await executor.execute("search_vocabulary_words", { query: "mitigate" });
    const searchData = searchRes.data as { words: Array<{ word: string; ipa: string }> };
    expect(searchData.words).toHaveLength(1);
    expect(searchData.words[0].ipa).toBe("/ˈmɪt.ɪ.ɡeɪt/");

    const detailRes = await executor.execute("get_vocabulary_word", { word: "resilient" });
    const detailData = detailRes.data as { occurrenceCountAcrossSets: number };
    expect(detailData.occurrenceCountAcrossSets).toBe(2);
  });

  it("retrieves learning overview, set stats, due reviews, and weak words", async () => {
    const overview = await executor.execute("get_learning_overview", {});
    expect((overview.data as { totalSets: number; uniqueWordCount: number }).totalSets).toBe(2);
    expect((overview.data as { uniqueWordCount: number }).uniqueWordCount).toBe(2);

    const setStats = await executor.execute("get_set_learning_statistics", {});
    expect((setStats.data as { sets: unknown[] }).sets).toHaveLength(2);

    const due = await executor.execute("get_due_reviews", {});
    expect((due.data as { totalDueCount: number }).totalDueCount).toBe(1);

    const attention = await executor.execute("get_words_needing_attention", {});
    const attData = attention.data as { words: Array<{ word: string; mistakeCount: number }> };
    expect(attData.words[0].word).toBe("mitigate");
    expect(attData.words[0].mistakeCount).toBeGreaterThanOrEqual(2);
  });

  it("enforces strict user isolation and strips spoofed user_id arguments", async () => {
    await executor.execute("list_vocabulary_words", {
      user_id: "attacker-id",
      owner_id: "attacker-id",
    });

    const ownerChecks = capturedFilters.filter(
      (f) => f.col === "owner_id" || f.col === "user_id"
    );
    expect(ownerChecks.length).toBeGreaterThan(0);
    for (const check of ownerChecks) {
      expect(check.val).toBe("user-owner-1");
    }
  });
});
