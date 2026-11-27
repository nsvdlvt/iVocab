import { describe, expect, it } from "vitest";
import { SrsService } from "@/lib/srs/srs-service";
import {
  areAllSetsLearnCompleted,
  buildTemporaryLearnWordsForSet,
  canUnlockPersonalTestSet,
} from "../flashcard-session";
import type { PersonalTestFlashcardItem } from "@/types/vocabee-test";

describe("SrsService.promoteAfterPersonalTestLearn", () => {
  const fixedNow = new Date("2026-11-27T10:00:00.000Z");

  it("promotes level 0 directly to level 2 with initial 1-day review", () => {
    const result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 0, progress: 0, nextReviewAt: null, intervalDays: null },
      now: fixedNow,
    });

    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(2);
    expect(result.state.intervalDays).toBe(1);
    expect(result.state.nextReviewAt).toBe("2026-11-28T10:00:00.000Z");
  });

  it("promotes level 1 to level 2 with initial 1-day review", () => {
    const result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 1, progress: 0, nextReviewAt: null, intervalDays: null },
      now: fixedNow,
    });

    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(2);
    expect(result.state.intervalDays).toBe(1);
  });

  it("increments level >= 2 by +1 regardless of future nextReviewAt", () => {
    const futureReview = new Date("2026-12-20T10:00:00.000Z").toISOString();

    const lv2Result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 2, progress: 0, nextReviewAt: futureReview, intervalDays: 1 },
      now: fixedNow,
    });
    expect(lv2Result.gainedLevel).toBe(true);
    expect(lv2Result.state.level).toBe(3);
    expect(lv2Result.state.intervalDays).toBe(3);

    const lv3Result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 3, progress: 0, nextReviewAt: futureReview, intervalDays: 3 },
      now: fixedNow,
    });
    expect(lv3Result.gainedLevel).toBe(true);
    expect(lv3Result.state.level).toBe(4);
    expect(lv3Result.state.intervalDays).toBe(7);

    const lv4Result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 4, progress: 0, nextReviewAt: futureReview, intervalDays: 7 },
      now: fixedNow,
    });
    expect(lv4Result.gainedLevel).toBe(true);
    expect(lv4Result.state.level).toBe(5);
    expect(lv4Result.state.nextReviewAt).toBeNull();
  });

  it("caps level 5 at level 5 without claiming gainedLevel", () => {
    const result = SrsService.promoteAfterPersonalTestLearn({
      currentState: { level: 5, progress: 0, nextReviewAt: null, intervalDays: null },
      now: fixedNow,
    });

    expect(result.gainedLevel).toBe(false);
    expect(result.state.level).toBe(5);
    expect(result.state.nextReviewAt).toBeNull();
  });
});

describe("Personal Test Set -> Learn gating helpers", () => {
  it("gates Set 2 behind Set 1 Learn completion unless Set 2 already has answers", () => {
    expect(canUnlockPersonalTestSet(0, {}, {})).toBe(true);
    expect(canUnlockPersonalTestSet(1, {}, {})).toBe(false);
    expect(canUnlockPersonalTestSet(1, { 0: true }, {})).toBe(true);
    expect(canUnlockPersonalTestSet(2, { 0: true }, {})).toBe(false);
    expect(canUnlockPersonalTestSet(2, { 0: true, 1: true }, {})).toBe(true);
    expect(canUnlockPersonalTestSet(1, {}, { s1_e0_matching_1: "answer" })).toBe(true);
  });

  it("requires all Sets with words to complete Learn before finishing the test", () => {
    expect(areAllSetsLearnCompleted(2, {})).toBe(false);
    expect(areAllSetsLearnCompleted(2, { 0: true })).toBe(false);
    expect(areAllSetsLearnCompleted(2, { 0: true, 1: true })).toBe(true);
  });

  it("builds temporary LearnViewer VocabularyRows from Set flashcards", () => {
    const cards: PersonalTestFlashcardItem[] = [
      {
        id: "vocab-1",
        sourceVocabularyIds: ["vocab-1"],
        word: "resilient",
        ipa: "/rɪˈzɪl.i.ənt/",
        partOfSpeech: "adj",
        meaning: "kiên cường",
        example: "She is resilient.",
        exampleTranslation: "Cô ấy rất kiên cường.",
        synonyms: ["tough"],
        audioUrl: "https://example.com/audio.mp3",
      },
    ];

    const rows = buildTemporaryLearnWordsForSet(cards);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("vocab-1");
    expect(rows[0].word).toBe("resilient");
    expect(rows[0].meaning).toBe("kiên cường");
    expect(rows[0].synonyms).toEqual(["tough"]);
  });
});
