export type ReviewOrderPreference = "review-first" | "mixed" | "new-first";

export interface LearningSettings {
  maxNewWordsPerDay: number;
  maxReviewsPerDay: number;
  reviewAheadDays: number;
  autoIntroduceNewWords: boolean;
  reviewOrder: ReviewOrderPreference;
  introduceNewWordsWhenNoReviews: boolean;
}
