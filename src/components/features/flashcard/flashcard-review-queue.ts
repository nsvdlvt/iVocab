import { FlashcardRow } from "./flashcard-utils";

export interface FlashcardReviewQueueState {
  queue: FlashcardRow[];
  knownCount: number;
}

export type FlashcardReviewAction = "known" | "not-yet";

export function createFlashcardReviewQueue(words: FlashcardRow[]): FlashcardReviewQueueState {
  return {
    queue: [...words],
    knownCount: 0,
  };
}

export function advanceFlashcardReviewQueue(
  state: FlashcardReviewQueueState,
  action: FlashcardReviewAction
): FlashcardReviewQueueState {
  if (state.queue.length === 0) return state;

  const [current, ...rest] = state.queue;
  if (!current) return state;

  if (action === "known") {
    return {
      queue: rest,
      knownCount: state.knownCount + 1,
    };
  }

  return {
    queue: [...rest, current],
    knownCount: state.knownCount,
  };
}

export function isFlashcardReviewComplete(state: FlashcardReviewQueueState): boolean {
  return state.queue.length === 0;
}
