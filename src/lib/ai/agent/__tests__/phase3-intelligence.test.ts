// src/lib/ai/agent/__tests__/phase3-intelligence.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentToolExecutor } from "../tools";
import { ReviewRepository } from "@/repositories/review.repository";

const { mockWords, mockSets } = vi.hoisted(() => {
  const mockWords = [
    {
      id: "w-1",
      set_id: "vs_A",
      owner_id: "user-intel",
      word: "alleviate",
      ipa: "/əˈliː.vi.eɪt/",
      part_of_speech: "verb",
      meaning: "làm dịu bớt",
      example: "Medicine helps alleviate pain.",
      example_translation: null,
      synonyms: ["ease", "relieve"],
      antonyms: ["worsen"],
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "hard",
      source: "manual",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      deleted_at: null,
      fts_vector: null,
      is_starred: false,
      vocab_sets: { id: "vs_A", title: "Academic", deleted_at: null },
      review: {
        id: "r1",
        user_id: "user-intel",
        vocabulary_id: "w-1",
        status: "lv1",
        next_review: null,
        last_review: "2026-11-10T00:00:00Z",
        last_grade: "again",
        ease_factor: 2.0,
        interval: 1,
        repetitions: 1,
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-10T00:00:00Z",
      },
    },
    {
      id: "w-2",
      set_id: "vs_A",
      owner_id: "user-intel",
      word: "resilient",
      ipa: "/rɪˈzɪl.i.ənt/",
      part_of_speech: "adjective",
      meaning: "kiên cường",
      example: "Resilient teams adapt quickly.",
      example_translation: null,
      synonyms: ["adaptable"],
      antonyms: [],
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
      vocab_sets: { id: "vs_A", title: "Academic", deleted_at: null },
      review: null,
    },
  ];

  const mockSets = [
    {
      id: "vs_A",
      user_id: "user-intel",
      title: "Academic",
      description: null,
      source_language: "en",
      target_language: "vi",
      color: "blue",
      icon: "BookOpen",
      visibility: "private",
      source: "manual",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      last_studied_at: null,
      deleted_at: null,
    },
  ];

  return { mockWords, mockSets };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: (table: string) => {
      const data =
        table === "vocab_sets" ? mockSets : table === "vocabularies" ? mockWords : [];
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        is: () => chain,
        gte: () => chain,
        order: () => chain,
        range: () => Promise.resolve({ data, error: null }),
        insert: () => ({ then: (r: (v: unknown) => void) => r({ error: null }) }),
        then: (r: (v: unknown) => void) => r({ data, error: null }),
      };
      return chain;
    },
  })),
}));

vi.mock("@/repositories/review.repository", () => ({
  ReviewRepository: {
    getDueReviews: vi.fn().mockResolvedValue([
      { review: mockWords[0].review, vocabulary: mockWords[0] },
    ]),
    processResult: vi.fn(),
  },
}));

vi.mock("@/repositories/statistics.repository", () => ({
  StatisticsRepository: {
    getDashboardStats: vi.fn().mockResolvedValue({
      totalSets: 1,
      totalWords: 2,
      dashboardVocabularyStats: {
        totalWords: 2,
        newWords: 1,
        learningWords: 1,
        learnedWords: 0,
        masteredWords: 0,
        dueToday: 1,
        overdue: 0,
        forecast: { total: 1, averagePerDay: 0.1, busiestDay: null, days: [] },
        rows: mockWords,
      },
      masteredWords: 0,
      learningWords: 1,
      todayReviewCount: 1,
      streak: 0,
      dailyProgress: { studiedWords: 0, reviewedWords: 0, goal: 20, progressPercent: 0 },
      weeklyActivity: [],
      todaySummary: {
        studiedWords: 0,
        reviewedWords: 0,
        studySeconds: 0,
        quizzesCompleted: 0,
        dictationsCompleted: 0,
        sentencesCompleted: 0,
      },
    }),
  },
}));

describe("Phase 3 – Learning Intelligence & Exercise Generation", () => {
  const executor = new AgentToolExecutor("user-intel");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports insufficient activity history honestly instead of fabricating trends", async () => {
    const res = await executor.execute("analyze_learning_patterns", { days: 30 });
    const data = res.data as {
      dataSufficiency: { hasActivityHistory: boolean; note: string };
      weakWords: Array<{ word: string }>;
    };

    expect(data.dataSufficiency.hasActivityHistory).toBe(false);
    expect(data.weakWords.some((w) => w.word === "alleviate")).toBe(true);
  });

  it("grounds personalized recommendations in ReviewRepository & SRS rules", async () => {
    const res = await executor.execute("get_personalized_recommendations", {});
    const data = res.data as {
      dueReviewsCount: number;
      wordsToRelearn: Array<{ word: string }>;
      recommendedNewWords: Array<{ word: string }>;
    };

    expect(data.dueReviewsCount).toBe(1);
    expect(data.wordsToRelearn.some((w) => w.word === "alleviate")).toBe(true);
    expect(data.recommendedNewWords.some((w) => w.word === "resilient")).toBe(true);
  });

  it("generates exercises from real vocabulary IDs without modifying SRS data", async () => {
    const res = await executor.execute("generate_practice_exercise", {
      exercise_type: "mcq",
      count: 2,
    });

    const data = res.data as {
      srsModified: boolean;
      questions: Array<{ vocabularyId: string; options: string[]; correctAnswer: string }>;
    };

    expect(data.srsModified).toBe(false);
    expect(data.questions).toHaveLength(2);
    for (const q of data.questions) {
      expect(["w-1", "w-2"]).toContain(q.vocabularyId);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
    expect(ReviewRepository.processResult).not.toHaveBeenCalled();
  });

  it("builds a valid Personal Test confirmation preview grounded in real words", async () => {
    const res = await executor.execute("save_personal_test", {
      title: "Weak Words Practice",
      max_words: 5,
    });

    expect(res.confirmations).toHaveLength(1);
    expect(res.confirmations?.[0].action).toBe("save_personal_test");
  });
});
