import { Database } from "@/types/database";

export type LearningMode = "learn" | "dictation" | "sentence-practice" | "flashcard" | "review";
export type AnswerResult = "correct" | "wrong" | "near" | "unknown";

export type SrsLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type SrsStatus = `lv${SrsLevel}`;

export interface SrsReviewState {
  level: SrsLevel;
  progress: number;
  nextReviewAt: string | null;
  intervalDays: number | null;
}

export interface ProcessLearningResultParams {
  mode: LearningMode;
  answerResult: AnswerResult;
  currentState?: Partial<SrsReviewState> | null;
  now?: Date;
}

export interface ProcessLearningResult {
  shouldPersist: boolean;
  canContribute: boolean;
  gainedLevel: boolean;
  state: SrsReviewState;
}

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

const LEARNING_THRESHOLDS: Record<0 | 1, number> = {
  0: 1,
  1: 1,
};

const INITIAL_REVIEW_INTERVAL_DAYS = 1;

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseLevel(status?: string | null): SrsLevel {
  if (status === "lv0") return 0;
  if (status === "lv1") return 1;
  if (status === "lv2") return 2;
  if (status === "lv3") return 3;
  if (status === "lv4") return 4;
  if (status === "lv5") return 5;
  return 0;
}

function toStatus(level: SrsLevel): SrsStatus {
  return `lv${level}` as SrsStatus;
}

export const SrsService = {
  getLevelFromReview(row?: Pick<ReviewRow, "status"> | null): SrsLevel {
    return parseLevel(row?.status ?? null);
  },

  canGainLevel(params: {
    mode: LearningMode;
    level: SrsLevel;
    answerResult: AnswerResult;
    nextReviewAt?: string | null;
    now?: Date;
  }): boolean {
    const now = params.now ?? new Date();
    const isCorrect = params.answerResult === "correct" || params.answerResult === "near";
    if (!isCorrect) return false;

    if (params.mode === "flashcard") return false;
    if (params.level < 2) {
      return params.mode === "sentence-practice" ? false : true;
    }
    if (!params.nextReviewAt) return false;
    return new Date(params.nextReviewAt).getTime() <= now.getTime();
  },

  canReviewWord(params: {
    level: SrsLevel;
    nextReviewAt?: string | null;
    now?: Date;
  }): boolean {
    const now = params.now ?? new Date();
    return params.level >= 2 && !!params.nextReviewAt && new Date(params.nextReviewAt).getTime() <= now.getTime();
  },

  scheduleNextReview(params: {
    level: SrsLevel;
    now?: Date;
  }): Pick<SrsReviewState, "nextReviewAt" | "intervalDays"> {
    const now = params.now ?? new Date();

    if (params.level === 2) {
      return { nextReviewAt: addDays(now, 3).toISOString(), intervalDays: 3 };
    }

    if (params.level === 3) {
      return { nextReviewAt: addDays(now, 7).toISOString(), intervalDays: 7 };
    }

    if (params.level === 4) {
      return { nextReviewAt: null, intervalDays: null };
    }

    return { nextReviewAt: null, intervalDays: null };
  },

  updateVocabularyLevel(params: {
    currentState?: Partial<SrsReviewState> | null;
    mode: LearningMode;
    answerResult: AnswerResult;
    now?: Date;
  }): ProcessLearningResult {
    const now = params.now ?? new Date();
    const currentLevel = params.currentState?.level ?? 0;
    const currentProgress = params.currentState?.progress ?? 0;
    if (params.mode === "flashcard") {
      const isCorrect = params.answerResult === "correct" || params.answerResult === "near";
      const nextLevel = isCorrect ? Math.min(5, currentLevel + 1) as SrsLevel : Math.max(0, currentLevel - 1) as SrsLevel;
      const nextState: SrsReviewState = {
        level: nextLevel,
        progress: 0,
        ...(nextLevel >= 2
          ? nextLevel === 2
            ? this.scheduleInitialReview(now)
            : this.scheduleNextReview({ level: nextLevel as 2 | 3 | 4, now })
          : { nextReviewAt: null, intervalDays: null }),
      };

      return {
        shouldPersist: true,
        canContribute: true,
        gainedLevel: nextLevel > currentLevel,
        state: nextState,
      };
    }

    const due = this.canReviewWord({
      level: currentLevel,
      nextReviewAt: params.currentState?.nextReviewAt ?? null,
      now,
    });
    const isCorrect = params.answerResult === "correct" || params.answerResult === "near";

    const canContribute =
      (params.mode !== "sentence-practice" || currentLevel >= 2) &&
      (currentLevel < 2 || due);

    if (!canContribute) {
      return {
        shouldPersist: false,
        canContribute: false,
        gainedLevel: false,
        state: {
          level: currentLevel,
          progress: currentProgress,
          nextReviewAt: params.currentState?.nextReviewAt ?? null,
          intervalDays: params.currentState?.intervalDays ?? null,
        },
      };
    }

    const nextProgress = isCorrect ? currentProgress + 1 : Math.max(0, currentProgress - 1);
    let nextLevel = currentLevel;
    let nextState: SrsReviewState = {
      level: currentLevel,
      progress: nextProgress,
      nextReviewAt: params.currentState?.nextReviewAt ?? null,
      intervalDays: params.currentState?.intervalDays ?? null,
    };

    if (currentLevel < 2) {
      const threshold = LEARNING_THRESHOLDS[currentLevel as 0 | 1];
      if (isCorrect && nextProgress >= threshold) {
        nextLevel = (currentLevel + 1) as SrsLevel;
        nextState = {
          level: nextLevel,
          progress: 0,
          ...(nextLevel === 2 ? this.scheduleInitialReview(now) : { nextReviewAt: null, intervalDays: null }),
        };
      }
      return {
        shouldPersist: true,
        canContribute: true,
        gainedLevel: nextLevel !== currentLevel,
        state: nextState,
      };
    }

    if (!due) {
      return {
        shouldPersist: false,
        canContribute: false,
        gainedLevel: false,
        state: nextState,
      };
    }

    if (isCorrect) {
      nextLevel = Math.min(5, currentLevel + 1) as SrsLevel;
      const scheduled =
        nextLevel >= 5
          ? { nextReviewAt: null, intervalDays: null }
          : this.scheduleNextReview({ level: currentLevel as 2 | 3 | 4, now });
      nextState = {
        level: nextLevel,
        progress: 0,
        ...scheduled,
      };
    }

    return {
      shouldPersist: true,
      canContribute: true,
      gainedLevel: nextLevel !== currentLevel,
      state: nextState,
    };
  },

  processLearningResult(params: ProcessLearningResultParams): ProcessLearningResult {
    return this.updateVocabularyLevel({
      currentState: params.currentState,
      mode: params.mode,
      answerResult: params.answerResult,
      now: params.now,
    });
  },

  scheduleInitialReview(now = new Date()): Pick<SrsReviewState, "nextReviewAt" | "intervalDays"> {
    return {
      nextReviewAt: addDays(now, INITIAL_REVIEW_INTERVAL_DAYS).toISOString(),
      intervalDays: INITIAL_REVIEW_INTERVAL_DAYS,
    };
  },

  toReviewUpdate(state: SrsReviewState, now = new Date()): ReviewUpdate {
    return {
      status: toStatus(state.level),
      repetitions: state.progress,
      interval: state.intervalDays,
      // Keep phase-1 rows compatible with databases that still enforce NOT NULL on next_review.
      // The SRS scheduling semantics remain unchanged because all review queries only read Lv2+ rows.
      next_review: state.nextReviewAt ?? now.toISOString(),
      last_review: now.toISOString(),
      updated_at: now.toISOString(),
    };
  },
};
