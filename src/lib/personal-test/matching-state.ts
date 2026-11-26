import type { ExerciseType } from "@/types/vocabee-test";
import { getQuestionKey } from "./vocabee-test-grader";

export interface MatchingStateItem {
  id: number;
  targetValue: string;
}

export interface ShuffledMatchingTarget {
  id: number;
  targetValue: string;
  displayTarget: string;
}

/**
 * Computes the list of matching answer updates needed to assign `targetValue` to `wordId`.
 * Ensures:
 * - Each word has at most one assigned definition.
 * - Each definition can only be assigned once across the exercise.
 * - Returning/replacing a definition frees the previous one back to the available pool.
 */
export function computeAssignMatchUpdates(params: {
  wordId: number;
  targetValue: string;
  items: MatchingStateItem[];
  userAnswers: Record<string, string>;
  setIndex: number;
  exerciseIndex: number;
  exerciseType: Extract<ExerciseType, "matching" | "synonyms_matching">;
}): Array<{ questionKey: string; value: string }> {
  const {
    wordId,
    targetValue,
    items,
    userAnswers,
    setIndex,
    exerciseIndex,
    exerciseType,
  } = params;

  const updates: Array<{ questionKey: string; value: string }> = [];
  const targetKey = getQuestionKey(setIndex, exerciseIndex, exerciseType, wordId);

  if (userAnswers[targetKey] === targetValue) {
    return updates;
  }

  // Unassign any other word that currently holds this definition
  for (const item of items) {
    if (item.id === wordId) continue;
    const otherKey = getQuestionKey(setIndex, exerciseIndex, exerciseType, item.id);
    if (userAnswers[otherKey] === targetValue) {
      updates.push({ questionKey: otherKey, value: "" });
    }
  }

  updates.push({ questionKey: targetKey, value: targetValue });
  return updates;
}

/**
 * Returns the remaining unassigned definitions/synonyms for the right column / available section.
 * Uses occurrence counting so no definition is ever silently lost.
 */
export function getAvailableMatchingTargets(params: {
  shuffledTargets: ShuffledMatchingTarget[];
  items: MatchingStateItem[];
  userAnswers: Record<string, string>;
  setIndex: number;
  exerciseIndex: number;
  exerciseType: Extract<ExerciseType, "matching" | "synonyms_matching">;
}): ShuffledMatchingTarget[] {
  const {
    shuffledTargets,
    items,
    userAnswers,
    setIndex,
    exerciseIndex,
    exerciseType,
  } = params;

  const assignedCounts = new Map<string, number>();
  for (const item of items) {
    const key = getQuestionKey(setIndex, exerciseIndex, exerciseType, item.id);
    const val = userAnswers[key];
    if (val) {
      assignedCounts.set(val, (assignedCounts.get(val) ?? 0) + 1);
    }
  }

  const remaining: ShuffledMatchingTarget[] = [];
  for (const target of shuffledTargets) {
    const usedCount = assignedCounts.get(target.targetValue) ?? 0;
    if (usedCount > 0) {
      assignedCounts.set(target.targetValue, usedCount - 1);
    } else {
      remaining.push(target);
    }
  }

  return remaining;
}
