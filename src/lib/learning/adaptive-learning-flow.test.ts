import { describe, it, expect, vi } from "vitest";
import { AdaptiveFlowEngine, type WordStudyItem } from "./adaptive-flow-engine";
import { AdaptiveSessionStore } from "./adaptive-session-store";
import {
  calculateWordMasteryPriority,
  prioritizeWordsForLearning,
  getDefaultSelectedWordIds,
  type VocabularyWithReview,
} from "./mastery-selection";
import type { ContextualMcqQuestion } from "@/lib/ai/schemas/contextual-mcq";

vi.mock("@/lib/ai/contextual-mcq", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/contextual-mcq")>();
  return {
    ...actual,
    generateContextualMcqs: vi.fn().mockImplementation(async (vocabInputs: any[]) => {
      return actual.generateDeterministicFallbackQuestions(vocabInputs);
    }),
  };
});

describe("Adaptive Learning Sessions & Mastery Flow", () => {
  const createMockWord = (
    id: string,
    word: string,
    opts: {
      difficulty?: string;
      status?: "lv0" | "lv1" | "lv2" | "lv3" | "lv4" | "lv5" | null;
      last_grade?: string | null;
      repetitions?: number;
      next_review?: string | null;
      last_review?: string | null;
    } = {}
  ): VocabularyWithReview => ({
    id,
    word,
    set_id: "vs_test123",
    owner_id: "user_owner",
    meaning: `Nghĩa của ${word}`,
    difficulty: opts.difficulty || "medium",
    ipa: `/${word}/`,
    part_of_speech: "verb",
    example: `This is an example sentence for ${word}.`,
    example_translation: `Đây là câu ví dụ cho ${word}.`,
    synonyms: null,
    antonyms: null,
    note: null,
    image_url: null,
    audio_url: null,
    source: "manual",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
    review: opts.status !== undefined || opts.last_review !== undefined
      ? {
          id: `rev_${id}`,
          user_id: "user_owner",
          vocabulary_id: id,
          status: opts.status ?? "lv0",
          ease_factor: 2.5,
          interval: 1,
          repetitions: opts.repetitions ?? 0,
          next_review: opts.next_review ?? null,
          last_review: opts.last_review ?? null,
          last_grade: opts.last_grade ?? null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        }
      : null,
  });

  describe("1. Word Selection & Mastery Prioritization", () => {
    it("preselects exactly 10 words when 10 or more words are available", () => {
      const words: VocabularyWithReview[] = [];
      for (let i = 1; i <= 25; i++) {
        words.push(createMockWord(`w_${i}`, `word_${i}`));
      }

      const selected = getDefaultSelectedWordIds(words, 10);
      expect(selected).toHaveLength(10);
    });

    it("preselects all available words if fewer than 10 exist", () => {
      const words = [
        createMockWord("w_1", "acquire"),
        createMockWord("w_2", "maintain"),
        createMockWord("w_3", "innovate"),
        createMockWord("w_4", "clarify"),
      ];

      const selected = getDefaultSelectedWordIds(words, 10);
      expect(selected).toHaveLength(4);
      expect(selected).toEqual(["w_1", "w_2", "w_3", "w_4"]);
    });

    it("prioritizes unlearned and low-mastery words over mastered words", () => {
      const unlearned = createMockWord("w_unlearned", "ephemeral", {
        difficulty: "C1",
        status: null,
      });

      const weakStruggling = createMockWord("w_weak", "meticulous", {
        difficulty: "B2",
        status: "lv1",
        last_grade: "wrong",
        repetitions: 1,
        last_review: "2026-10-20T00:00:00Z",
      });

      const mastered = createMockWord("w_mastered", "cat", {
        difficulty: "A1",
        status: "lv5",
        repetitions: 6,
        last_review: "2026-10-15T00:00:00Z",
      });

      const sorted = prioritizeWordsForLearning([mastered, unlearned, weakStruggling]);

      // Both unlearned and weak words must rank before mastered
      expect(sorted[2].id).toBe("w_mastered");
      expect([sorted[0].id, sorted[1].id]).toContain("w_unlearned");
      expect([sorted[0].id, sorted[1].id]).toContain("w_weak");
    });

    it("uses CEFR as secondary criterion without overriding mastery priority", () => {
      // Both words are unlearned
      const a1Unlearned = createMockWord("w_a1", "good", { difficulty: "A1", status: null });
      const c1Unlearned = createMockWord("w_c1", "ubiquitous", { difficulty: "C1", status: null });

      const sortedUnlearned = prioritizeWordsForLearning([c1Unlearned, a1Unlearned]);
      // A1 foundational gets secondary priority when both unlearned
      expect(sortedUnlearned[0].id).toBe("w_a1");

      // But a mastered A1 must NEVER beat an unlearned C1
      const a1Mastered = createMockWord("w_a1_mastered", "good", { difficulty: "A1", status: "lv5", repetitions: 5, last_review: "2026-01-01" });
      const sortedWithMastery = prioritizeWordsForLearning([a1Mastered, c1Unlearned]);
      expect(sortedWithMastery[0].id).toBe("w_c1");
    });
  });

  describe("2. Unfinished Sessions & State Machine", () => {
    const mockStudyItems: WordStudyItem[] = [
      createMockWord("v_1", "diligent", { status: "lv0" }),
      createMockWord("v_2", "pragmatic", { status: "lv1" }),
      createMockWord("v_3", "resilient", { status: "lv2" }),
    ];

    const mockPregenQuestions: ContextualMcqQuestion[] = [
      {
        id: "q_1",
        vocabularyId: "v_1",
        targetWord: "diligent",
        questionType: "contextual_mcq",
        difficulty: "medium",
        prompt: "Chọn từ:",
        sentence: "She is a ______ student.",
        options: ["diligent", "lazy", "careless", "slow"],
        correctAnswerIndex: 0,
        explanation: "Diligent nghĩa là chăm chỉ.",
        strongestDistractor: "lazy",
        whyDistractorWrong: "Lazy trái nghĩa.",
        hint: "Chăm chỉ.",
      },
      {
        id: "q_2",
        vocabularyId: "v_2",
        targetWord: "pragmatic",
        questionType: "contextual_mcq",
        difficulty: "challenging",
        prompt: "Chọn từ:",
        sentence: "We need a ______ solution.",
        options: ["pragmatic", "idealistic", "theoretical", "fictional"],
        correctAnswerIndex: 0,
        explanation: "Pragmatic nghĩa là thực tế.",
        strongestDistractor: "theoretical",
        whyDistractorWrong: "Theoretical chỉ lý thuyết.",
        hint: "Thực tế.",
      },
      {
        id: "q_3",
        vocabularyId: "v_3",
        targetWord: "resilient",
        questionType: "contextual_mcq",
        difficulty: "easy",
        prompt: "Chọn từ:",
        sentence: "He was very ______ in facing difficulties.",
        options: ["resilient", "fragile", "weak", "soft"],
        correctAnswerIndex: 0,
        explanation: "Resilient nghĩa là kiên cường.",
        strongestDistractor: "fragile",
        whyDistractorWrong: "Fragile là dễ vỡ.",
        hint: "Kiên cường.",
      },
    ];

    it("creates a session with exact selected word IDs and restores initial state", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const setId = "vs_test_01";

      const sessionResult = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        mockStudyItems,
        {
          pregeneratedQuestions: mockPregenQuestions,
          initialStage: "flashcards",
        }
      );

      expect(sessionResult.sessionId).toBeDefined();
      expect(sessionResult.totalWords).toBe(3);
      expect(sessionResult.stage).toBe("flashcards");

      // Verify session can be retrieved with exact user ownership
      const session = await AdaptiveSessionStore.getSession(sessionResult.sessionId, userId);
      expect(session).toBeDefined();
      expect(session?.selectedWordIds).toEqual(["v_1", "v_2", "v_3"]);
      expect(session?.currentCardIndex).toBe(0);
    });

    it("saves progress checkpoints and restores stage, card index, and reviewed cards", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440002";
      const setId = "vs_test_02";

      const sessionResult = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        mockStudyItems,
        mockPregenQuestions
      );

      // Save flashcard checkpoint at card index 2
      await AdaptiveSessionStore.saveCheckpoint(sessionResult.sessionId, userId, {
        stage: "flashcards",
        currentCardIndex: 2,
        reviewedCardIds: ["v_1", "v_2"],
      });

      const session = await AdaptiveSessionStore.getSession(sessionResult.sessionId, userId);
      expect(session?.currentCardIndex).toBe(2);
      expect(session?.reviewedCardIds).toEqual(["v_1", "v_2"]);
    });

    it("evaluates answers on server and persists scores and streaks without leaking answer key", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440003";
      const setId = "vs_test_03";

      const sessionResult = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        mockStudyItems,
        mockPregenQuestions
      );

      // Verify client question does not expose correctAnswerIndex
      expect((sessionResult.firstQuestion as any).correctAnswerIndex).toBeUndefined();

      // Submit correct answer to q_1
      const submitResult = await AdaptiveSessionStore.submitAnswer(
        sessionResult.sessionId,
        userId,
        "q_1",
        0
      );

      expect(submitResult.isCorrect).toBe(true);
      expect(submitResult.explanation).toContain("Diligent nghĩa là chăm chỉ");

      const session = await AdaptiveSessionStore.getSession(sessionResult.sessionId, userId);
      expect(session?.score).toBe(10);
      expect(session?.streak).toBe(1);
      expect(session?.highestStreak).toBe(1);
      expect(session?.answersHistory).toHaveLength(1);
    });
  });

  describe("3. Completion & Idempotent Mastery Updates", () => {
    it("completes session, returns summary, and marks session as completed", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440004";
      const setId = "vs_test_04";

      const mockWord: WordStudyItem = createMockWord("v_done", "innovate", { status: "lv1" });
      const mockPregen: ContextualMcqQuestion = {
        id: "q_done",
        vocabularyId: "v_done",
        targetWord: "innovate",
        questionType: "contextual_mcq",
        difficulty: "easy",
        prompt: "Chọn từ:",
        sentence: "Companies must ______ to survive.",
        options: ["innovate", "stagnate", "hesitate", "quit"],
        correctAnswerIndex: 0,
        explanation: "Innovate nghĩa là đổi mới sáng tạo.",
        strongestDistractor: "stagnate",
        whyDistractorWrong: "Stagnate là trì trệ.",
        hint: "Đổi mới.",
      };

      const { sessionId } = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        [mockWord],
        [mockPregen]
      );

      await AdaptiveSessionStore.submitAnswer(sessionId, userId, "q_done", 0);

      // Finish session
      const summary1 = await AdaptiveSessionStore.finishSession(sessionId, userId);
      expect(summary1).toBeDefined();
      expect(summary1?.totalQuestions).toBe(1);
      expect(summary1?.correctCount).toBe(1);
      expect(summary1?.accuracy).toBe(100);

      // Idempotency: calling finishSession again returns existing summary without errors
      const summary2 = await AdaptiveSessionStore.finishSession(sessionId, userId);
      expect(summary2?.accuracy).toBe(summary1?.accuracy);
      expect(summary2?.totalQuestions).toBe(summary1?.totalQuestions);
    });
  });

  describe("4. Question Submission Flow, Idempotency & Duplicate Prevention", () => {
    it("submits first question and advances to second question independently with unique IDs", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440010";
      const setId = "vs_consec01";

      const words: WordStudyItem[] = [
        createMockWord("v_c1", "diligent", { status: "lv0" }),
        createMockWord("v_c2", "pragmatic", { status: "lv0" }),
      ];

      const questions: ContextualMcqQuestion[] = [
        {
          id: "q_c1",
          vocabularyId: "v_c1",
          targetWord: "diligent",
          questionType: "contextual_mcq",
          difficulty: "medium",
          prompt: "Chọn từ:",
          sentence: "She is a ______ student.",
          options: ["diligent", "lazy", "careless", "slow"],
          correctAnswerIndex: 0,
          explanation: "Diligent nghĩa là chăm chỉ.",
          strongestDistractor: "lazy",
          whyDistractorWrong: "Lazy trái nghĩa.",
          hint: "Chăm chỉ.",
        },
        {
          id: "q_c2",
          vocabularyId: "v_c2",
          targetWord: "pragmatic",
          questionType: "contextual_mcq",
          difficulty: "medium",
          prompt: "Chọn từ:",
          sentence: "We need a ______ solution.",
          options: ["pragmatic", "idealistic", "theoretical", "fictional"],
          correctAnswerIndex: 0,
          explanation: "Pragmatic nghĩa là thực tế.",
          strongestDistractor: "theoretical",
          whyDistractorWrong: "Theoretical chỉ lý thuyết.",
          hint: "Thực tế.",
        },
      ];

      const session = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        words,
        questions
      );

      // Question 1 submission
      const q1Id = session.firstQuestion!.id;
      const result1 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        q1Id,
        0
      );

      expect(result1.isCorrect).toBe(true);
      expect(result1.nextQuestion).toBeDefined();
      expect(result1.nextQuestion?.id).not.toBe(q1Id);

      // Question 2 submission using nextQuestion.id
      const q2Id = result1.nextQuestion!.id;
      const result2 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        q2Id,
        0
      );

      expect(result2.isCorrect).toBe(true);
      // Both questions are registered in history independently
      const stored = await AdaptiveSessionStore.getSession(session.sessionId, userId);
      expect(stored?.answersHistory).toHaveLength(2);
      expect(stored?.askedQuestionIds).toEqual([q1Id, q2Id]);
      expect(stored?.score).toBe(20);
      expect(stored?.streak).toBe(2);
    });

    it("handles rapid double-submission and network retry idempotently without duplicating scores", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440011";
      const setId = "vs_retry01";

      const words: WordStudyItem[] = [
        createMockWord("v_r1", "resilient", { status: "lv0" }),
      ];
      const questions: ContextualMcqQuestion[] = [
        {
          id: "q_r1",
          vocabularyId: "v_r1",
          targetWord: "resilient",
          questionType: "contextual_mcq",
          difficulty: "easy",
          prompt: "Chọn từ:",
          sentence: "He was very ______.",
          options: ["resilient", "fragile", "weak", "soft"],
          correctAnswerIndex: 0,
          explanation: "Resilient là kiên cường.",
          strongestDistractor: "fragile",
          whyDistractorWrong: "Fragile là dễ vỡ.",
          hint: "Kiên cường.",
        },
      ];

      const session = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        words,
        questions
      );

      // First submit
      const result1 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        "q_r1",
        0
      );
      expect(result1.isCorrect).toBe(true);

      // Rapid duplicate submit (same questionId, simulating double-click or retry)
      const result2 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        "q_r1",
        0
      );

      // Must succeed safely without throwing "already submitted" error
      expect(result2.isDuplicateSubmission).toBe(true);
      expect(result2.isCorrect).toBe(true);

      // Check that answers history and score are not duplicated
      const stored = await AdaptiveSessionStore.getSession(session.sessionId, userId);
      expect(stored?.answersHistory).toHaveLength(1);
      expect(stored?.score).toBe(10);
    });

    it("sanitizes AI template IDs like 'q1' to prevent collision with previously asked questions", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440012";
      const setId = "vs_col01";

      const words: WordStudyItem[] = [
        createMockWord("v_col1", "word1", { status: "lv0" }),
        createMockWord("v_col2", "word2", { status: "lv0" }),
      ];

      // Both questions provided with conflicting template ID "q1"
      const questions: ContextualMcqQuestion[] = [
        {
          id: "q1",
          vocabularyId: "v_col1",
          targetWord: "word1",
          questionType: "contextual_mcq",
          difficulty: "medium",
          prompt: "Chọn từ:",
          sentence: "Sentence 1 ______.",
          options: ["word1", "opt2", "opt3", "opt4"],
          correctAnswerIndex: 0,
          explanation: "Exp 1",
          strongestDistractor: "opt2",
          whyDistractorWrong: "Wrong 1",
          hint: "Hint 1",
        },
        {
          id: "q1", // Duplicate ID intentionally testing collision resolution
          vocabularyId: "v_col2",
          targetWord: "word2",
          questionType: "contextual_mcq",
          difficulty: "medium",
          prompt: "Chọn từ:",
          sentence: "Sentence 2 ______.",
          options: ["word2", "opt2", "opt3", "opt4"],
          correctAnswerIndex: 0,
          explanation: "Exp 2",
          strongestDistractor: "opt2",
          whyDistractorWrong: "Wrong 2",
          hint: "Hint 2",
        },
      ];

      const session = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        words,
        questions
      );

      // Answer question 1
      const result1 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        session.firstQuestion!.id,
        0
      );

      expect(result1.isCorrect).toBe(true);
      expect(result1.nextQuestion).toBeDefined();

      // Next question must NOT have the same ID as question 1
      expect(result1.nextQuestion!.id).not.toBe(session.firstQuestion!.id);

      // Submitting question 2 must succeed and not be rejected as a duplicate
      const result2 = await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        result1.nextQuestion!.id,
        0
      );

      expect(result2.isCorrect).toBe(true);
      expect(result2.isDuplicateSubmission).toBeFalsy();
    });

    it("restores unfinished session with an unasked question on resume/refresh", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440013";
      const setId = "vs_resum01";

      const words: WordStudyItem[] = [
        createMockWord("v_res1", "wordA", { status: "lv0" }),
        createMockWord("v_res2", "wordB", { status: "lv0" }),
      ];

      const questions: ContextualMcqQuestion[] = [
        {
          id: "q_res_1",
          vocabularyId: "v_res1",
          targetWord: "wordA",
          questionType: "contextual_mcq",
          difficulty: "easy",
          prompt: "Chọn:",
          sentence: "A ______",
          options: ["wordA", "b", "c", "d"],
          correctAnswerIndex: 0,
          explanation: "Exp A",
          strongestDistractor: "b",
          whyDistractorWrong: "Wrong b",
          hint: "Hint A",
        },
        {
          id: "q_res_2",
          vocabularyId: "v_res2",
          targetWord: "wordB",
          questionType: "contextual_mcq",
          difficulty: "easy",
          prompt: "Chọn:",
          sentence: "B ______",
          options: ["wordB", "b", "c", "d"],
          correctAnswerIndex: 0,
          explanation: "Exp B",
          strongestDistractor: "b",
          whyDistractorWrong: "Wrong b",
          hint: "Hint B",
        },
      ];

      const session = await AdaptiveSessionStore.createSession(
        userId,
        setId,
        words,
        { pregeneratedQuestions: questions, initialStage: "practice" }
      );

      // Answer question 1
      await AdaptiveSessionStore.submitAnswer(
        session.sessionId,
        userId,
        "q_res_1",
        0
      );

      // Simulate page refresh / resume
      const active = await AdaptiveSessionStore.getActiveSession(userId, setId);
      expect(active).toBeDefined();
      expect(active?.currentQuestion).toBeDefined();
      // Current question on resume must be unasked (not q_res_1)
      expect(active?.currentQuestion?.id).not.toBe("q_res_1");
      expect(active?.session.askedQuestionIds).toContain("q_res_1");
    });
  });
});
