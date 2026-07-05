import { VocabularyRow, QuestionDirection, QuestionType, AnswerState } from "./question-types";
import { ADAPTIVE_CONFIG, VARIETY_CONFIG } from "./config";

export interface LearningState {
  word: VocabularyRow;
  correctStreak: number;
  wrongCount: number;
  status: "learning" | "mastered";
}

export interface SessionStats {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
}

export interface RecentQuestionConfig {
  direction: QuestionDirection;
  type: QuestionType;
}

export class AdaptiveEngine {
  static initializeStates(words: VocabularyRow[]): LearningState[] {
    return words.map((w) => ({
      word: w,
      correctStreak: 0,
      wrongCount: 0,
      status: "learning",
    }));
  }

  static selectNextWord(params: {
    states: LearningState[];
    recentAskedIds: string[];
    orderRandom: boolean;
    recentConfigs?: RecentQuestionConfig[];
    settings: {
      directionEnVi: boolean;
      directionViEn: boolean;
      typeMcq: boolean;
      typeInput: boolean;
    };
  }): { selected: LearningState; direction: QuestionDirection; type: QuestionType } | null {
    const { states, recentAskedIds, orderRandom, recentConfigs = [], settings } = params;
    const remaining = states.filter((s) => s.status === "learning");
    if (remaining.length === 0) {
      return null;
    }

    // Filter out recent inputs to avoid repetitions
    let candidates = remaining;
    if (remaining.length > 2) {
      candidates = remaining.filter((s) => !recentAskedIds.includes(s.word.id));
      if (candidates.length === 0) candidates = remaining; // fallback
    }

    let selected: LearningState;
    if (orderRandom) {
      // Priority formula logic using internal weights and streaks
      const priorities = candidates.map((s) => {
        // Calculate dynamic decay based on streak
        const streakDecay = s.correctStreak * ADAPTIVE_CONFIG.WEIGHTS.correctDecayBase;
        const priorityVal =
          s.wrongCount * ADAPTIVE_CONFIG.WEIGHTS.wrong - streakDecay + Math.random() * 15;
        return { state: s, priority: priorityVal };
      });
      priorities.sort((a, b) => b.priority - a.priority);
      selected = priorities[0].state;
    } else {
      selected = candidates[0];
    }

    // Determine direction and type with variety rules (weighted random choice)
    // Analyze history to avoid consecutive configurations
    const directionHistory = recentConfigs.map((c) => c.direction);
    const typeHistory = recentConfigs.map((c) => c.type);

    const allowedDirections: QuestionDirection[] = [];
    if (settings.directionEnVi) allowedDirections.push("en-vi");
    if (settings.directionViEn) allowedDirections.push("vi-en");
    if (allowedDirections.length === 0) allowedDirections.push("en-vi");

    const allowedTypes: QuestionType[] = [];
    if (settings.typeMcq) allowedTypes.push("mcq");
    if (settings.typeInput) allowedTypes.push("input");
    if (allowedTypes.length === 0) allowedTypes.push("mcq");

    // Apply variety constraints using configuration thresholds
    let direction = allowedDirections[Math.floor(Math.random() * allowedDirections.length)];
    if (
      directionHistory.length >= VARIETY_CONFIG.consecutiveDirectionsLimit &&
      directionHistory.slice(0, VARIETY_CONFIG.consecutiveDirectionsLimit).every((d) => d === directionHistory[0]) &&
      allowedDirections.length > 1
    ) {
      const alternate = allowedDirections.filter((d) => d !== directionHistory[0]);
      if (alternate.length > 0) direction = alternate[Math.floor(Math.random() * alternate.length)];
    }

    let type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    if (
      typeHistory.length >= VARIETY_CONFIG.consecutiveTypesLimit &&
      typeHistory.slice(0, VARIETY_CONFIG.consecutiveTypesLimit).every((t) => t === typeHistory[0]) &&
      allowedTypes.length > 1
    ) {
      const alternate = allowedTypes.filter((t) => t !== typeHistory[0]);
      if (alternate.length > 0) type = alternate[Math.floor(Math.random() * alternate.length)];
    }

    return {
      selected,
      direction,
      type,
    };
  }

  static updateProgress(params: {
    states: LearningState[];
    wordId: string;
    answerResult: AnswerState;
  }): LearningState[] {
    const { states, wordId, answerResult } = params;
    return states.map((s) => {
      if (s.word.id === wordId) {
        let isSuccessful = false;
        let priorityDiff = 0;

        if (answerResult === "correct") {
          isSuccessful = true;
          priorityDiff = -s.correctStreak * ADAPTIVE_CONFIG.WEIGHTS.correctDecayBase;
        } else if (answerResult === "near") {
          isSuccessful = true;
          priorityDiff = ADAPTIVE_CONFIG.WEIGHTS.near;
        } else if (answerResult === "wrong") {
          priorityDiff = ADAPTIVE_CONFIG.WEIGHTS.wrong;
        } else if (answerResult === "unknown") {
          priorityDiff = ADAPTIVE_CONFIG.WEIGHTS.unknown;
        }

        const nextStreak = isSuccessful ? s.correctStreak + 1 : 0;
        // Adjust s.wrongCount according to priorityDiff weights
        const priorityFactor = Math.max(0, Math.ceil(priorityDiff / 50));
        const nextWrong = isSuccessful
          ? s.wrongCount
          : s.wrongCount + (answerResult === "unknown" ? ADAPTIVE_CONFIG.WEIGHTS.unknownIncrementBase : ADAPTIVE_CONFIG.WEIGHTS.wrongIncrementBase) + priorityFactor;
        const nextStatus = nextStreak >= 2 ? "mastered" : "learning";

        return {
          ...s,
          correctStreak: nextStreak,
          wrongCount: nextWrong,
          status: nextStatus,
        };
      }
      return s;
    });
  }
}
