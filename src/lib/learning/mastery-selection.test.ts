import { describe, it, expect } from "vitest";
import {
  calculateWordMasteryPriority,
  prioritizeWordsForLearning,
  getDefaultSelectedWordIds,
  type VocabularyWithReview,
} from "./mastery-selection";

describe("Mastery-Based Word Selection", () => {
  const baseWord = (id: string, word: string, difficulty: string): VocabularyWithReview => ({
    id,
    word,
    set_id: "vs_123",
    owner_id: "user_1",
    meaning: `Nghĩa của ${word}`,
    difficulty,
    ipa: null,
    part_of_speech: "noun",
    example: null,
    example_translation: null,
    synonyms: null,
    antonyms: null,
    note: null,
    image_url: null,
    audio_url: null,
    source: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
  });

  it("prioritizes unmastered B1 word over mastered A1 word", () => {
    const unmasteredB1: VocabularyWithReview = {
      ...baseWord("w1", "meticulous", "B1"),
      review: null, // never practiced
    };

    const masteredA1: VocabularyWithReview = {
      ...baseWord("w2", "apple", "A1"),
      review: {
        id: "r2",
        user_id: "user_1",
        vocabulary_id: "w2",
        status: "lv5", // Mastered
        ease_factor: 2.5,
        interval: 30,
        repetitions: 5,
        next_review: null,
        last_review: "2026-01-01T00:00:00Z",
        last_grade: "correct",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    };

    const scoreB1 = calculateWordMasteryPriority(unmasteredB1);
    const scoreA1 = calculateWordMasteryPriority(masteredA1);

    expect(scoreB1).toBeGreaterThan(scoreA1);

    const sorted = prioritizeWordsForLearning([masteredA1, unmasteredB1]);
    expect(sorted[0].id).toBe("w1");
  });

  it("prioritizes words answered incorrectly over words consistently answered correctly", () => {
    const wrongWord: VocabularyWithReview = {
      ...baseWord("w_wrong", "alleviate", "B2"),
      review: {
        id: "r_wrong",
        user_id: "user_1",
        vocabulary_id: "w_wrong",
        status: "lv1",
        ease_factor: 2.1,
        interval: 1,
        repetitions: 1,
        next_review: null,
        last_review: "2026-10-20T00:00:00Z",
        last_grade: "wrong", // Answered incorrectly
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-10-20T00:00:00Z",
      },
    };

    const consistentWord: VocabularyWithReview = {
      ...baseWord("w_correct", "happy", "A1"),
      review: {
        id: "r_correct",
        user_id: "user_1",
        vocabulary_id: "w_correct",
        status: "lv4",
        ease_factor: 2.6,
        interval: 14,
        repetitions: 4,
        next_review: "2026-11-01T00:00:00Z",
        last_review: "2026-10-18T00:00:00Z",
        last_grade: "correct",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-10-18T00:00:00Z",
      },
    };

    const sorted = prioritizeWordsForLearning([consistentWord, wrongWord]);
    expect(sorted[0].id).toBe("w_wrong");
  });

  it("does not treat unpracticed words as mastered simply because they have no incorrect answers", () => {
    const unpracticed: VocabularyWithReview = {
      ...baseWord("w_new", "ubiquitous", "C1"),
      review: null,
    };

    const mastered: VocabularyWithReview = {
      ...baseWord("w_done", "dog", "A1"),
      review: {
        id: "r_done",
        user_id: "user_1",
        vocabulary_id: "w_done",
        status: "lv5",
        ease_factor: 2.5,
        interval: 30,
        repetitions: 5,
        next_review: null,
        last_review: "2026-01-01T00:00:00Z",
        last_grade: "correct",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    };

    const sorted = prioritizeWordsForLearning([mastered, unpracticed]);
    expect(sorted[0].id).toBe("w_new");
  });

  it("selects all words if total words is fewer than 10", () => {
    const list: VocabularyWithReview[] = [
      baseWord("1", "one", "A1"),
      baseWord("2", "two", "A1"),
      baseWord("3", "three", "A1"),
    ];

    const selected = getDefaultSelectedWordIds(list, 10);
    expect(selected.length).toBe(3);
    expect(selected).toEqual(["1", "2", "3"]);
  });

  it("selects exactly 10 words if >= 10 words exist", () => {
    const list: VocabularyWithReview[] = [];
    for (let i = 1; i <= 15; i++) {
      list.push(baseWord(`w_${i}`, `word_${i}`, "B1"));
    }

    const selected = getDefaultSelectedWordIds(list, 10);
    expect(selected.length).toBe(10);
  });

  it("produces stable and deterministic ordering across multiple runs", () => {
    const list: VocabularyWithReview[] = [];
    for (let i = 1; i <= 20; i++) {
      list.push(baseWord(`w_${i}`, `word_${i}`, i % 2 === 0 ? "A1" : "C1"));
    }

    const run1 = getDefaultSelectedWordIds(list, 10);
    const run2 = getDefaultSelectedWordIds(list, 10);
    expect(run1).toEqual(run2);
  });
});
