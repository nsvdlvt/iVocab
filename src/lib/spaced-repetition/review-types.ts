export enum ReviewGrade {
  Again,
  Hard,
  Good,
  Easy
}

export type ReviewStatus = "new" | "learning" | "review" | "mastered";

export interface ReviewState {
  vocabularyId: string;
  ownerId: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date;
  lapses: number;
  status: ReviewStatus;
}

export interface ReviewResult {
  previous: ReviewState;
  current: ReviewState;
  grade: ReviewGrade;
  intervalChange: number;
  easeFactorChange: number;
  becameMastered: boolean;
  becameLearning: boolean;
  becameReview: boolean;
}

export interface SpacedRepetitionAlgorithm {
  calculateNextState(params: {
    currentState: ReviewState;
    grade: ReviewGrade;
    now: Date;
  }): ReviewState;
}

export interface ReviewForecastItem {
  date: Date;
  dueCount: number;
}
