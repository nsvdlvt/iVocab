import { describe, it, expect } from "vitest";
import {
  validateContextualMcqQuestion,
  sanitizeQuestionGiveaways,
  generateDeterministicFallbackQuestions,
} from "./contextual-mcq";
import type { ContextualMcqQuestion } from "./schemas/contextual-mcq";

describe("Contextual MCQ Validation & Generation", () => {
  it("should validate a well-formed challenging contextual MCQ", () => {
    const validQuestion: ContextualMcqQuestion = {
      id: "q_test_1",
      vocabularyId: "vocab_1",
      targetWord: "reached",
      questionType: "contextual_mcq",
      difficulty: "challenging",
      prompt: "Chọn từ phù hợp nhất theo ngữ cảnh:",
      sentence: "After months of negotiation, both sides finally ______ an agreement that addressed their main concerns.",
      options: ["reached", "achieved", "gained", "acquired"],
      correctAnswerIndex: 0,
      explanation: "Cụm 'reach an agreement' là collocation tự nhiên chuẩn mực.",
      strongestDistractor: "achieved",
      whyDistractorWrong: "'Achieve' đi với mục tiêu/thành tựu, không đi tự nhiên với 'an agreement'.",
      hint: "Động từ thường đi kèm với 'an agreement'.",
    };

    const error = validateContextualMcqQuestion(validQuestion);
    expect(error).toBeNull();
  });

  it("should reject questions without the blank placeholder ______", () => {
    const invalidQuestion: ContextualMcqQuestion = {
      id: "q_test_2",
      vocabularyId: "vocab_1",
      targetWord: "reached",
      questionType: "contextual_mcq",
      difficulty: "challenging",
      prompt: "Chọn từ phù hợp:",
      sentence: "After months of negotiation, both sides reached an agreement.", // Missing ______
      options: ["reached", "achieved", "gained", "acquired"],
      correctAnswerIndex: 0,
      explanation: "Hợp lệ",
      strongestDistractor: "achieved",
      whyDistractorWrong: "Lý do",
    };

    const error = validateContextualMcqQuestion(invalidQuestion);
    expect(error).toContain("Sentence does not contain the required blank");
  });

  it("should reject questions with duplicate options", () => {
    const duplicateOptionsQuestion: ContextualMcqQuestion = {
      id: "q_test_3",
      vocabularyId: "vocab_1",
      targetWord: "reached",
      questionType: "contextual_mcq",
      difficulty: "challenging",
      prompt: "Chọn từ phù hợp:",
      sentence: "Both sides ______ an agreement.",
      options: ["reached", "achieved", "reached", "acquired"], // duplicate 'reached'
      correctAnswerIndex: 0,
      explanation: "Giải thích",
      strongestDistractor: "achieved",
      whyDistractorWrong: "Lý do",
    };

    const error = validateContextualMcqQuestion(duplicateOptionsQuestion);
    expect(error).toContain("contains duplicate options");
  });

  it("should reject questions where strongest distractor is identical to correct answer", () => {
    const badDistractorQuestion: ContextualMcqQuestion = {
      id: "q_test_4",
      vocabularyId: "vocab_1",
      targetWord: "exacerbate",
      questionType: "contextual_mcq",
      difficulty: "challenging",
      prompt: "Chọn từ:",
      sentence: "The new rules actually ______ the burden.",
      options: ["exacerbate", "alleviate", "reduce", "ease"],
      correctAnswerIndex: 0,
      explanation: "Giải thích",
      strongestDistractor: "exacerbate", // matches correct option!
      whyDistractorWrong: "Lý do",
    };

    const error = validateContextualMcqQuestion(badDistractorQuestion);
    expect(error).toContain("Strongest distractor cannot be the correct answer");
  });

  it("should sanitize phonetic article giveaways when options have mixed vowels", () => {
    const giveawayQuestion: ContextualMcqQuestion = {
      id: "q_test_5",
      vocabularyId: "vocab_1",
      targetWord: "apple",
      questionType: "contextual_mcq",
      difficulty: "medium",
      prompt: "Chọn từ:",
      sentence: "She ate a ______ yesterday afternoon.",
      options: ["banana", "apple", "peach", "pear"], // apple starts with vowel, others consonant
      correctAnswerIndex: 1,
      explanation: "Giải thích",
      strongestDistractor: "banana",
      whyDistractorWrong: "Lý do",
    };

    const sanitized = sanitizeQuestionGiveaways(giveawayQuestion);
    expect(sanitized.sentence).toContain("a/an ______");
  });

  it("should generate deterministic fallback questions if AI is offline", () => {
    const fallbackItems = [
      {
        id: "w1",
        word: "mitigate",
        meaning: "giảm nhẹ, làm dịu bớt",
        partOfSpeech: "verb",
        example: "The government took steps to mitigate the economic crisis.",
      },
      {
        id: "w2",
        word: "exacerbate",
        meaning: "làm trầm trọng thêm",
        partOfSpeech: "verb",
        example: "The cold weather exacerbated his condition.",
      },
    ];

    const fallbacks = generateDeterministicFallbackQuestions(fallbackItems);
    expect(fallbacks.length).toBe(2);
    expect(fallbacks[0].options).toHaveLength(4);
    expect(fallbacks[0].sentence).toContain("______");
    expect(fallbacks[0].correctAnswerIndex).toBeGreaterThanOrEqual(0);
    expect(fallbacks[0].correctAnswerIndex).toBeLessThanOrEqual(3);
    expect(fallbacks[0].options[fallbacks[0].correctAnswerIndex]).toBe(fallbacks[0].targetWord);
  });
});
