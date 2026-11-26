import { describe, it, expect } from "vitest";
import { validateVocabeeTestJson, resolveAnswerToTargetWord } from "../vocabee-test-validator";
import { gradeVocabeeTest, normalizeAnswer, getQuestionKey } from "../vocabee-test-grader";
import { parseClozePassage, extractClozeBlankIds } from "../vocabee-test-parser";
import { SAMPLE_VOCABEE_TEST } from "../sample-test";
import { VocabeeTest } from "@/types/vocabee-test";

describe("Personal Test: Vocabee Test Validator & Schema", () => {
  it("should validate the sample Vocabee test successfully", () => {
    const result = validateVocabeeTestJson(SAMPLE_VOCABEE_TEST);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.summary.title).toBe("Academic Vocabulary Mastery - Set 1 & 2");
      expect(result.summary.totalWords).toBe(6);
      expect(result.summary.totalSets).toBe(2);
      expect(result.summary.totalExercises).toBe(8);
      expect(result.summary.totalQuestions).toBe(24);
    }
  });

  it("should fail when schema literal is incorrect", () => {
    const invalid = { ...SAMPLE_VOCABEE_TEST, schema: "vocabee-test-v2" };
    const result = validateVocabeeTestJson(invalid);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.path.includes("schema"))).toBe(true);
    }
  });

  it("should fail when total_sets does not match sets array length", () => {
    const invalid = { ...SAMPLE_VOCABEE_TEST, total_sets: 5 };
    const result = validateVocabeeTestJson(invalid);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find((e) => e.path === "total_sets");
      expect(err).toBeDefined();
      expect(err?.found).toBe("5");
      expect(err?.expected).toBe("2");
    }
  });

  it("should fail when total_words does not match unique words count", () => {
    const invalid = { ...SAMPLE_VOCABEE_TEST, total_words: 99 };
    const result = validateVocabeeTestJson(invalid);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const err = result.errors.find((e) => e.path === "total_words");
      expect(err).toBeDefined();
      expect(err?.found).toBe("99");
      expect(err?.expected).toBe("6");
    }
  });

  it("should fail when set IDs are duplicated", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    cloned.sets[1].id = cloned.sets[0].id;
    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.message.includes("trùng lặp"))).toBe(true);
    }
  });

  it("should fail when exercise order is violated", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    // Swap matching and cloze_test
    const temp = cloned.sets[0].exercises[0];
    cloned.sets[0].exercises[0] = cloned.sets[0].exercises[3];
    cloned.sets[0].exercises[3] = temp;

    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.message.includes("Thứ tự bài tập"))).toBe(true);
    }
  });

  it("should fail when sentence completion is missing a blank placeholder", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    const ex1 = cloned.sets[0].exercises[1];
    if (ex1.type === "sentence_completion") {
      ex1.items[0].sentence = "This sentence has no blank placeholder.";
    }
    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.message.includes('thiếu vị trí trống "___"'))).toBe(true);
    }
  });

  it("should fail when sentence completion has multiple blanks in one sentence", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    const ex1 = cloned.sets[0].exercises[1];
    if (ex1.type === "sentence_completion") {
      ex1.items[0].sentence = "This ___ has multiple ___ blanks.";
    }
    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.message.includes("Tìm thấy 2 vị trí trống"))).toBe(true);
    }
  });

  it("should detect invalid placeholder format in cloze test passage", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    const ex3 = cloned.sets[0].exercises[3];
    if (ex3.type === "cloze_test") {
      ex3.passage = "Some text with ***(1)*** invalid syntax and ___(2)___ and ___(3)___.";
    }
    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.found?.includes("***(1)***"))).toBe(true);
    }
  });

  it("should fail when cloze test blanks count does not match answers count", () => {
    const cloned = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    const ex3 = cloned.sets[0].exercises[3];
    if (ex3.type === "cloze_test") {
      ex3.answers.pop(); // remove 1 answer
    }
    const result = validateVocabeeTestJson(cloned);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.message.includes("không khớp với số lượng đáp án"))).toBe(true);
    }
  });
});

describe("Personal Test: Parser & Grader", () => {
  it("should parse cloze test passage into text and blank segments correctly", () => {
    const passage = "Hello ___(1)___ world and ___(2)___ again!";
    const segments = parseClozePassage(passage);
    expect(segments).toEqual([
      { type: "text", value: "Hello " },
      { type: "blank", value: "___(1)___", blankId: 1 },
      { type: "text", value: " world and " },
      { type: "blank", value: "___(2)___", blankId: 2 },
      { type: "text", value: " again!" },
    ]);

    expect(extractClozeBlankIds(passage)).toEqual([1, 2]);
  });

  it("should normalize answer strings cleanly", () => {
    expect(normalizeAnswer("  Hello World.  ")).toBe("hello world");
    expect(normalizeAnswer("mitigate,   lessen.")).toBe("mitigate, lessen");
  });

  it("should grade test answers and calculate accurate scores", () => {
    const test = SAMPLE_VOCABEE_TEST;
    const answers: Record<string, string> = {};

    // Answer Set 0 correctly
    const s0 = 0;
    // Matching
    answers[getQuestionKey(s0, 0, "matching", 1)] = "To make something less severe, harmful, or painful";
    answers[getQuestionKey(s0, 0, "matching", 2)] = "To be the first to develop or use a new method or idea";
    answers[getQuestionKey(s0, 0, "matching", 3)] = "To examine or inspect someone or something very closely and carefully";

    // Sentence Completion
    answers[getQuestionKey(s0, 1, "sentence_completion", 1)] = "mitigate";
    answers[getQuestionKey(s0, 1, "sentence_completion", 2)] = "scrutinize";
    answers[getQuestionKey(s0, 1, "sentence_completion", 3)] = "pioneer";

    // Synonyms Matching
    answers[getQuestionKey(s0, 2, "synonyms_matching", 1)] = "alleviate, lessen";
    answers[getQuestionKey(s0, 2, "synonyms_matching", 2)] = "innovate";
    answers[getQuestionKey(s0, 2, "synonyms_matching", 3)] = "inspect, examine";

    // Cloze Test
    answers[getQuestionKey(s0, 3, "cloze_test", 1)] = "pioneer";
    answers[getQuestionKey(s0, 3, "cloze_test", 2)] = "scrutinize";
    answers[getQuestionKey(s0, 3, "cloze_test", 3)] = "mitigate";

    // Set 1 left empty (wrong)
    const result = gradeVocabeeTest(test, answers);

    expect(result.totalQuestions).toBe(24);
    expect(result.correctAnswers).toBe(12);
    expect(result.incorrectAnswers).toBe(12);
    expect(result.accuracyPercentage).toBe(50);
    expect(result.score).toBe(50);

    // Set 0 should be 100%
    const set0Summary = result.setSummaries.find((s) => s.setIndex === 0);
    expect(set0Summary?.score).toBe(100);
    expect(set0Summary?.correctQuestions).toBe(12);

    // Set 1 should be 0%
    const set1Summary = result.setSummaries.find((s) => s.setIndex === 1);
    expect(set1Summary?.score).toBe(0);
    expect(set1Summary?.correctQuestions).toBe(0);
  });

  it("should resolve regular, irregular, and derivational grammatical transformations to base target words", () => {
    const bank = ["exacerbate", "mitigate", "seek", "analyze", "strengthen"];
    expect(resolveAnswerToTargetWord("exacerbated", bank)).toBe("exacerbate");
    expect(resolveAnswerToTargetWord("mitigating", bank)).toBe("mitigate");
    expect(resolveAnswerToTargetWord("mitigation", bank)).toBe("mitigate");
    expect(resolveAnswerToTargetWord("sought", bank)).toBe("seek");
    expect(resolveAnswerToTargetWord("analytical", bank)).toBe("analyze");
    expect(resolveAnswerToTargetWord("strengthens", bank)).toBe("strengthen");
    expect(resolveAnswerToTargetWord("unrelated", bank)).toBeNull();
  });
});
