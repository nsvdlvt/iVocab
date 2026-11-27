import { describe, expect, it } from "vitest";
import {
  buildFlashcardsFromRecords,
  getFlashcardAssessmentSummary,
  getFlashcardsForSet,
  isExerciseFullyAnswered,
  resolveFlashcardsForTestContent,
} from "../flashcard-session";
import { SAMPLE_VOCABEE_TEST } from "../sample-test";
import { validateVocabeeTestJson } from "../vocabee-test-validator";
import { getQuestionKey } from "../vocabee-test-grader";
import type { SelectableVocabularyWord } from "../vocabulary-selection";

function makeWordRecord(
  overrides: Partial<SelectableVocabularyWord> & { id: string; word: string; meaning: string }
): SelectableVocabularyWord {
  return {
    set_id: "set-1",
    set_title: "Academic Set",
    set_color: "blue",
    ipa: null,
    part_of_speech: null,
    example: null,
    example_translation: null,
    synonyms: null,
    note: null,
    difficulty: "B2",
    created_at: "2026-11-27T00:00:00Z",
    is_starred: false,
    ...overrides,
  };
}

describe("Personal Test Flashcards & Session Helpers", () => {
  it("preserves vocabee-test-v1 schema with exactly 4 exercise types", () => {
    const validation = validateVocabeeTestJson(SAMPLE_VOCABEE_TEST);
    expect(validation.valid).toBe(true);
    for (const set of SAMPLE_VOCABEE_TEST.sets) {
      expect(set.exercises).toHaveLength(4);
    }
  });

  it("builds unique flashcards from DB records without inventing missing fields", () => {
    const rec1 = makeWordRecord({
      id: "rec-1",
      word: "mitigate",
      meaning: "giảm nhẹ",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
      part_of_speech: "verb",
      example: "New policies mitigate flood risks.",
      example_translation: "Các chính sách mới làm giảm nguy cơ lũ lụt.",
      synonyms: ["alleviate", "lessen"],
    });

    const rec2MissingOptional = makeWordRecord({
      id: "rec-2",
      word: "pioneer",
      meaning: "tiên phong",
      ipa: null,
      part_of_speech: null,
      example: null,
      example_translation: null,
      synonyms: null,
    });

    // Duplicate reference to the same record ID should not produce a duplicate flashcard
    const cards = buildFlashcardsFromRecords([rec1, rec1, rec2MissingOptional]);
    expect(cards).toHaveLength(2);

    expect(cards[0]).toEqual({
      id: "rec-1",
      sourceVocabularyIds: ["rec-1"],
      word: "mitigate",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
      partOfSpeech: "verb",
      meaning: "giảm nhẹ",
      example: "New policies mitigate flood risks.",
      exampleTranslation: "Các chính sách mới làm giảm nguy cơ lũ lụt.",
      synonyms: ["alleviate", "lessen"],
      audioUrl: null,
    });

    // Missing fields remain null/empty — never fabricated
    expect(cards[1]).toEqual({
      id: "rec-2",
      sourceVocabularyIds: ["rec-2"],
      word: "pioneer",
      ipa: null,
      partOfSpeech: null,
      meaning: "tiên phong",
      example: null,
      exampleTranslation: null,
      synonyms: [],
      audioUrl: null,
    });
  });

  it("resolves flashcards for test content prioritizing selected record IDs and without fabricating deleted records", () => {
    const setARecord = makeWordRecord({
      id: "rec-set-a",
      set_id: "set-a",
      word: "mitigate",
      meaning: "giảm thiểu (Set A)",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    });
    const setBRecord = makeWordRecord({
      id: "rec-set-b",
      set_id: "set-b",
      word: "mitigate",
      meaning: "làm dịu (Set B)",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    });

    const cards = resolveFlashcardsForTestContent(
      SAMPLE_VOCABEE_TEST,
      [setBRecord, setARecord],
      ["rec-set-a"]
    );

    expect(cards).toHaveLength(6);
    expect(cards[0].id).toBe("rec-set-a");
    expect(cards[0].meaning).toBe("giảm thiểu (Set A)");

    // Words missing from DB fall back gracefully without inventing IPA/POS/examples/synonyms
    const missingFromDb = cards.find((c) => c.word === "scrutinize");
    expect(missingFromDb).toBeDefined();
    expect(missingFromDb?.ipa).toBeNull();
    expect(missingFromDb?.partOfSpeech).toBeNull();
    expect(missingFromDb?.example).toBeNull();
    expect(missingFromDb?.exampleTranslation).toBeNull();
    expect(missingFromDb?.synonyms).toEqual([]);
  });

  it("calculates temporary flashcard self-assessment summary accurately", () => {
    const cards = buildFlashcardsFromRecords([
      makeWordRecord({ id: "w1", word: "alpha", meaning: "một" }),
      makeWordRecord({ id: "w2", word: "beta", meaning: "hai" }),
      makeWordRecord({ id: "w3", word: "gamma", meaning: "ba" }),
      makeWordRecord({ id: "w4", word: "delta", meaning: "bốn" }),
    ]);

    const summary = getFlashcardAssessmentSummary(
      cards,
      {
        w1: "remembered",
        w2: "not_remembered",
      },
      new Set(["w1", "w2", "w3"])
    );

    expect(summary).toEqual({
      totalCount: 4,
      reviewedCount: 3,
      rememberedCount: 1,
      notRememberedCount: 1,
      unassessedCount: 2,
    });
  });

  it("detects completed exercise stages accurately without losing preserved answers", () => {
    const answers: Record<string, string> = {};
    const matchingEx = SAMPLE_VOCABEE_TEST.sets[0].exercises[0];
    if (matchingEx.type === "matching") {
      for (const item of matchingEx.items) {
        answers[getQuestionKey(0, 0, "matching", item.id)] = item.definition;
      }
    }

    expect(isExerciseFullyAnswered(SAMPLE_VOCABEE_TEST, 0, 0, answers)).toBe(true);
    expect(isExerciseFullyAnswered(SAMPLE_VOCABEE_TEST, 0, 1, answers)).toBe(false);
  });

  it("splits flashcards strictly by set (only the words belonging to each set)", () => {
    const allCards = resolveFlashcardsForTestContent(SAMPLE_VOCABEE_TEST, []);
    const set1Cards = getFlashcardsForSet(allCards, SAMPLE_VOCABEE_TEST.sets[0].words);
    const set2Cards = getFlashcardsForSet(allCards, SAMPLE_VOCABEE_TEST.sets[1].words);

    expect(set1Cards.map((c) => c.word)).toEqual(["mitigate", "pioneer", "scrutinize"]);
    expect(set2Cards.map((c) => c.word)).toEqual(["articulate", "bolster", "substantiate"]);
  });
});
