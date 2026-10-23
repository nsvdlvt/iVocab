import { describe, it, expect } from "vitest";
import { AdaptiveFlowEngine } from "./adaptive-flow-engine";
import { AdaptiveSessionStore } from "./adaptive-session-store";
import type { WordStudyItem } from "./adaptive-flow-engine";
import type { ContextualMcqQuestion } from "@/lib/ai/schemas/contextual-mcq";

describe("Adaptive Learning Flow Engine & Session Store", () => {
  const mockWords: WordStudyItem[] = [
    {
      id: "v1",
      word: "reach",
      meaning: "đạt được (thỏa thuận)",
      part_of_speech: "verb",
      review: {
        id: "r1",
        user_id: "u1",
        vocabulary_id: "v1",
        status: "lv0",
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: null,
        last_review: null,
        last_grade: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: "v2",
      word: "exacerbate",
      meaning: "làm trầm trọng thêm",
      part_of_speech: "verb",
      review: {
        id: "r2",
        user_id: "u1",
        vocabulary_id: "v2",
        status: "lv3",
        ease_factor: 2.5,
        interval: 3,
        repetitions: 2,
        next_review: null,
        last_review: null,
        last_grade: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: "v3",
      word: "alleviate",
      meaning: "làm giảm bớt, làm dịu",
      part_of_speech: "verb",
      review: null,
    },
  ];

  it("should initialize word states with correct SRS levels", () => {
    const states = AdaptiveFlowEngine.initWordStates(mockWords);
    expect(states.size).toBe(3);
    expect(states.get("v1")?.initialSrsLevel).toBe(0);
    expect(states.get("v2")?.initialSrsLevel).toBe(3);
    expect(states.get("v3")?.initialSrsLevel).toBe(0);
  });

  it("should assign recognition to unfamiliar words and challenging contextual MCQs to experienced words", () => {
    const states = AdaptiveFlowEngine.initWordStates(mockWords);
    const v1State = states.get("v1")!;
    const v2State = states.get("v2")!;

    // Lv0 unattempted word starts with recognition
    const v1Diff = AdaptiveFlowEngine.getDifficultyForWord(v1State);
    expect(v1Diff.questionType).toBe("recognition");
    expect(v1Diff.difficulty).toBe("easy");

    // Lv3 experienced word receives challenging contextual MCQ
    const v2Diff = AdaptiveFlowEngine.getDifficultyForWord(v2State);
    expect(v2Diff.questionType).toBe("contextual_mcq");
    expect(v2Diff.difficulty).toBe("challenging");
  });

  it("should adapt to supportive hint when a mistake occurs", () => {
    const states = AdaptiveFlowEngine.initWordStates(mockWords);
    const v2State = states.get("v2")!;

    // Simulate mistake on v2
    v2State.wrongCount = 1;
    v2State.consecutiveCorrect = 0;

    const diffAfterMistake = AdaptiveFlowEngine.getDifficultyForWord(v2State);
    expect(diffAfterMistake.questionType).toBe("supportive_hint");
    expect(diffAfterMistake.difficulty).toBe("easy");
  });

  it("should strip answer key and explanation from client safe question payload", () => {
    const internalQuestion: ContextualMcqQuestion = {
      id: "q_secret",
      vocabularyId: "v1",
      targetWord: "reach",
      questionType: "contextual_mcq",
      difficulty: "challenging",
      prompt: "Chọn từ phù hợp:",
      sentence: "They ______ an agreement.",
      options: ["reached", "achieved", "gained", "won"],
      correctAnswerIndex: 0,
      explanation: "Secret explanation",
      strongestDistractor: "achieved",
      whyDistractorWrong: "Secret reason",
      hint: "Secret hint",
    };

    const clientQuestion = AdaptiveFlowEngine.toClientSafeQuestion(internalQuestion, 1, 5);

    // Verify critical security requirement: NEVER expose answer key or explanation to client
    expect((clientQuestion as any).correctAnswerIndex).toBeUndefined();
    expect((clientQuestion as any).explanation).toBeUndefined();
    expect((clientQuestion as any).whyDistractorWrong).toBeUndefined();
    expect(clientQuestion.options).toHaveLength(4);
    expect(clientQuestion.id).toBe("q_secret");
  });

  it("should support end-to-end adaptive session in AdaptiveSessionStore", async () => {
    const userId = "test_user_456";
    const setId = "test_set_789";

    const pregenQuestions: ContextualMcqQuestion[] = [
      {
        id: "q1",
        vocabularyId: "v1",
        targetWord: "reach",
        questionType: "contextual_mcq",
        difficulty: "challenging",
        prompt: "Chọn từ:",
        sentence: "Both sides ______ an agreement.",
        options: ["reached", "achieved", "gained", "won"],
        correctAnswerIndex: 0,
        explanation: "Reach an agreement là collocation chuẩn.",
        strongestDistractor: "achieved",
        whyDistractorWrong: "Achieve không đi tự nhiên với an agreement.",
        hint: "Động từ thương lượng.",
      },
      {
        id: "q2",
        vocabularyId: "v2",
        targetWord: "exacerbate",
        questionType: "contextual_mcq",
        difficulty: "challenging",
        prompt: "Chọn từ:",
        sentence: "This policy ______ the problem.",
        options: ["eased", "exacerbated", "reduced", "helped"],
        correctAnswerIndex: 1,
        explanation: "Exacerbate mang nghĩa làm trầm trọng thêm.",
        strongestDistractor: "eased",
        whyDistractorWrong: "Eased ngược nghĩa.",
        hint: "Nghĩa tiêu cực.",
      },
      {
        id: "q3",
        vocabularyId: "v3",
        targetWord: "alleviate",
        questionType: "contextual_mcq",
        difficulty: "challenging",
        prompt: "Chọn từ:",
        sentence: "The medicine helped ______ the pain.",
        options: ["alleviate", "intensify", "prolong", "worsen"],
        correctAnswerIndex: 0,
        explanation: "Alleviate mang nghĩa làm giảm bớt.",
        strongestDistractor: "worsen",
        whyDistractorWrong: "Worsen mang nghĩa trái ngược.",
        hint: "Nghĩa làm dịu.",
      },
    ];

    // Create session
    const { sessionId, firstQuestion, totalWords } = await AdaptiveSessionStore.createSession(
      userId,
      setId,
      mockWords,
      pregenQuestions
    );

    expect(sessionId).toBeDefined();
    expect(totalWords).toBe(3);
    expect(firstQuestion).toBeDefined();

    // Verify first question does not leak answer key
    expect((firstQuestion as any).correctAnswerIndex).toBeUndefined();

    // Submit correct answer to q1
    const submitResult = await AdaptiveSessionStore.submitAnswer(
      sessionId,
      userId,
      "q1",
      0 // correct index
    );

    expect(submitResult.isCorrect).toBe(true);
    expect(submitResult.correctAnswerIndex).toBe(0);
    expect(submitResult.explanation).toContain("Reach an agreement");
    expect(submitResult.whyDistractorWrong).toContain("Achieve không đi tự nhiên");

    // Prevent duplicate submission of the same question
    await expect(
      AdaptiveSessionStore.submitAnswer(sessionId, userId, "q1", 0)
    ).rejects.toThrow("This question has already been submitted");

    // Finish session and check summary
    const summary = await AdaptiveSessionStore.finishSession(sessionId, userId);
    expect(summary).toBeDefined();
    expect(summary?.totalQuestions).toBe(1);
    expect(summary?.correctCount).toBe(1);
    expect(summary?.accuracy).toBe(100);
    expect(summary?.aiRecommendation).toBeDefined();
  });
});
