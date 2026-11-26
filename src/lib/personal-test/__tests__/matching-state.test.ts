import { describe, it, expect } from "vitest";
import {
  computeAssignMatchUpdates,
  getAvailableMatchingTargets,
  type MatchingStateItem,
  type ShuffledMatchingTarget,
} from "../matching-state";
import { getQuestionKey } from "../vocabee-test-grader";

describe("Personal Test: Matching State Management", () => {
  const items: MatchingStateItem[] = [
    { id: 1, targetValue: "def-1" },
    { id: 2, targetValue: "def-2" },
    { id: 3, targetValue: "def-3" },
  ];

  const shuffledTargets: ShuffledMatchingTarget[] = [
    { id: 2, targetValue: "def-2", displayTarget: "Definition 2" },
    { id: 1, targetValue: "def-1", displayTarget: "Definition 1" },
    { id: 3, targetValue: "def-3", displayTarget: "Definition 3" },
  ];

  const applyUpdates = (
    answers: Record<string, string>,
    updates: Array<{ questionKey: string; value: string }>
  ) => {
    const next = { ...answers };
    for (const u of updates) {
      next[u.questionKey] = u.value;
    }
    return next;
  };

  it("assigns a definition to a word and removes it from available definitions", () => {
    let answers: Record<string, string> = {};
    const updates = computeAssignMatchUpdates({
      wordId: 1,
      targetValue: "def-1",
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 0,
      exerciseType: "matching",
    });

    answers = applyUpdates(answers, updates);
    expect(answers[getQuestionKey(0, 0, "matching", 1)]).toBe("def-1");

    const available = getAvailableMatchingTargets({
      shuffledTargets,
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 0,
      exerciseType: "matching",
    });
    expect(available.map((t) => t.targetValue)).toEqual(["def-2", "def-3"]);
  });

  it("prevents duplicate assignment when dragging an already-assigned definition to another word", () => {
    let answers: Record<string, string> = {
      [getQuestionKey(0, 0, "matching", 1)]: "def-1",
    };

    const updates = computeAssignMatchUpdates({
      wordId: 2,
      targetValue: "def-1",
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 0,
      exerciseType: "matching",
    });
    answers = applyUpdates(answers, updates);

    expect(answers[getQuestionKey(0, 0, "matching", 1)]).toBe("");
    expect(answers[getQuestionKey(0, 0, "matching", 2)]).toBe("def-1");

    const available = getAvailableMatchingTargets({
      shuffledTargets,
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 0,
      exerciseType: "matching",
    });
    expect(available.map((t) => t.targetValue)).toEqual(["def-2", "def-3"]);
  });

  it("returns the replaced definition back to the available pool when replacing a word's match", () => {
    let answers: Record<string, string> = {
      [getQuestionKey(0, 2, "synonyms_matching", 1)]: "def-1",
    };

    const updates = computeAssignMatchUpdates({
      wordId: 1,
      targetValue: "def-2",
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 2,
      exerciseType: "synonyms_matching",
    });
    answers = applyUpdates(answers, updates);

    expect(answers[getQuestionKey(0, 2, "synonyms_matching", 1)]).toBe("def-2");

    const available = getAvailableMatchingTargets({
      shuffledTargets,
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 2,
      exerciseType: "synonyms_matching",
    });
    expect(available.map((t) => t.targetValue)).toEqual(["def-1", "def-3"]);
  });

  it("returns a definition to the available pool when unpaired", () => {
    const answers: Record<string, string> = {
      [getQuestionKey(0, 0, "matching", 1)]: "def-1",
      [getQuestionKey(0, 0, "matching", 2)]: "def-2",
    };

    answers[getQuestionKey(0, 0, "matching", 1)] = "";

    const available = getAvailableMatchingTargets({
      shuffledTargets,
      items,
      userAnswers: answers,
      setIndex: 0,
      exerciseIndex: 0,
      exerciseType: "matching",
    });
    expect(available.map((t) => t.targetValue)).toEqual(["def-1", "def-3"]);
  });
});
