import { describe, it, expect } from "vitest";
import { validateVocabeeTestJson } from "../vocabee-test-validator";
import { gradeVocabeeTest, checkSingleAnswer, normalizeAnswer, getQuestionKey } from "../vocabee-test-grader";
import { parseClozePassage, extractClozeBlankIds } from "../vocabee-test-parser";
import { SAMPLE_VOCABEE_TEST } from "../sample-test";
import { VocabeeTest } from "@/types/vocabee-test";

describe("Personal Test: Comprehensive Engine & Edge Cases", () => {
  it("should parse cloze test passages with various blank indices and complex punctuation", () => {
    const passage =
      "Technology continues to ___(1)___ our daily routines. When regulators ___(2)___ safety protocols, companies must ___(3)___ potential risks.";
    const segments = parseClozePassage(passage);

    expect(segments.length).toBe(7);
    expect(segments[0]).toEqual({ type: "text", value: "Technology continues to " });
    expect(segments[1]).toEqual({ type: "blank", value: "___(1)___", blankId: 1 });
    expect(segments[2]).toEqual({ type: "text", value: " our daily routines. When regulators " });
    expect(segments[3]).toEqual({ type: "blank", value: "___(2)___", blankId: 2 });
    expect(segments[4]).toEqual({ type: "text", value: " safety protocols, companies must " });
    expect(segments[5]).toEqual({ type: "blank", value: "___(3)___", blankId: 3 });
    expect(segments[6]).toEqual({ type: "text", value: " potential risks." });

    const blankIds = extractClozeBlankIds(passage);
    expect(blankIds).toEqual([1, 2, 3]);
  });

  it("should flexibly accept synonyms matching regardless of comma ordering", () => {
    // Correct is ["alleviate", "lessen"]
    expect(checkSingleAnswer("synonyms_matching", "alleviate, lessen", ["alleviate", "lessen"])).toBe(true);
    expect(checkSingleAnswer("synonyms_matching", "lessen, alleviate", ["alleviate", "lessen"])).toBe(true);
    expect(checkSingleAnswer("synonyms_matching", "  ALLEVIATE, LESSEN.  ", ["alleviate", "lessen"])).toBe(true);
    expect(checkSingleAnswer("synonyms_matching", "alleviate", ["alleviate", "lessen"])).toBe(true);
    expect(checkSingleAnswer("synonyms_matching", "wrong_word", ["alleviate", "lessen"])).toBe(false);
  });

  it("should handle sentence completion answers ignoring spaces, casing and trailing periods", () => {
    expect(checkSingleAnswer("sentence_completion", "Mitigate.", "mitigate")).toBe(true);
    expect(checkSingleAnswer("sentence_completion", "  mitigate  ", "mitigate")).toBe(true);
    expect(checkSingleAnswer("sentence_completion", "MITIGATE", "mitigate")).toBe(true);
    expect(checkSingleAnswer("sentence_completion", "pioneer", "mitigate")).toBe(false);
  });

  it("should grade a 100% perfect attempt across all 24 questions in 2 sets", () => {
    const test = SAMPLE_VOCABEE_TEST;
    const perfectAnswers: Record<string, string> = {};

    test.sets.forEach((set, sIdx) => {
      set.exercises.forEach((ex, eIdx) => {
        if (ex.type === "matching") {
          ex.items.forEach((item) => {
            perfectAnswers[getQuestionKey(sIdx, eIdx, "matching", item.id)] = item.definition;
          });
        } else if (ex.type === "sentence_completion") {
          ex.items.forEach((item) => {
            perfectAnswers[getQuestionKey(sIdx, eIdx, "sentence_completion", item.id)] = item.answer;
          });
        } else if (ex.type === "synonyms_matching") {
          ex.items.forEach((item) => {
            perfectAnswers[getQuestionKey(sIdx, eIdx, "synonyms_matching", item.id)] = item.synonyms.join(", ");
          });
        } else if (ex.type === "cloze_test") {
          ex.answers.forEach((ans) => {
            perfectAnswers[getQuestionKey(sIdx, eIdx, "cloze_test", ans.id)] = ans.answer;
          });
        }
      });
    });

    const grading = gradeVocabeeTest(test, perfectAnswers);
    expect(grading.totalQuestions).toBe(24);
    expect(grading.correctAnswers).toBe(24);
    expect(grading.incorrectAnswers).toBe(0);
    expect(grading.score).toBe(100);
    expect(grading.accuracyPercentage).toBe(100);

    grading.setSummaries.forEach((setSummary) => {
      expect(setSummary.score).toBe(100);
      expect(setSummary.correctQuestions).toBe(12);
    });

    grading.exerciseSummaries.forEach((exSummary) => {
      expect(exSummary.score).toBe(100);
      expect(exSummary.correctQuestions).toBe(6);
    });
  });

  it("should pinpoint exact error paths and suggestions for semantic violations", () => {
    const testWithMultipleErrors = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    // 1. Wrong total sets
    testWithMultipleErrors.total_sets = 99;
    // 2. Duplicate Set ID
    testWithMultipleErrors.sets[1].id = testWithMultipleErrors.sets[0].id;

    const validation = validateVocabeeTestJson(testWithMultipleErrors);
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.errors.some((e) => e.path === "total_sets")).toBe(true);
      expect(validation.errors.some((e) => e.message.includes("trùng lặp"))).toBe(true);
    }
  });

  it("should catch empty required fields via Zod validation", () => {
    const invalidTest = JSON.parse(JSON.stringify(SAMPLE_VOCABEE_TEST)) as VocabeeTest;
    invalidTest.sets[0].exercises[0].items[0].explanation = "";

    const validation = validateVocabeeTestJson(invalidTest);
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.errors.some((e) => e.path.includes("explanation"))).toBe(true);
    }
  });
});
