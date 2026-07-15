import { describe, expect, it } from "vitest";
import { advanceFlashcardReviewQueue, createFlashcardReviewQueue, isFlashcardReviewComplete } from "./flashcard-review-queue";

function makeWord(id: string) {
  return { id, word: id, meaning: id } as never;
}

describe("flashcard-review-queue", () => {
  it("keeps known cards out of the queue and advances progress", () => {
    const state = createFlashcardReviewQueue([makeWord("A"), makeWord("B"), makeWord("C")]);
    const next = advanceFlashcardReviewQueue(state, "known");

    expect(next.queue.map((word) => word.word)).toEqual(["B", "C"]);
    expect(next.knownCount).toBe(1);
  });

  it("moves not-yet cards to the end of the queue", () => {
    const state = createFlashcardReviewQueue([makeWord("A"), makeWord("B"), makeWord("C"), makeWord("D")]);
    const next = advanceFlashcardReviewQueue(state, "not-yet");

    expect(next.queue.map((word) => word.word)).toEqual(["B", "C", "D", "A"]);
    expect(next.knownCount).toBe(0);
  });

  it("completes when all cards are known", () => {
    let state = createFlashcardReviewQueue([makeWord("A"), makeWord("B")]);
    state = advanceFlashcardReviewQueue(state, "known");
    state = advanceFlashcardReviewQueue(state, "known");

    expect(isFlashcardReviewComplete(state)).toBe(true);
    expect(state.knownCount).toBe(2);
  });

  it("supports repeated not-yet cycles before completion", () => {
    let state = createFlashcardReviewQueue([makeWord("A"), makeWord("B")]);
    state = advanceFlashcardReviewQueue(state, "not-yet");
    state = advanceFlashcardReviewQueue(state, "not-yet");
    state = advanceFlashcardReviewQueue(state, "known");
    state = advanceFlashcardReviewQueue(state, "known");

    expect(isFlashcardReviewComplete(state)).toBe(true);
    expect(state.knownCount).toBe(2);
  });
});
