export const ADAPTIVE_CONFIG = {
  WEIGHTS: {
    unknown: 200,
    wrong: 100,
    near: 30,
    correctDecayBase: 50,
    wrongIncrementBase: 1,
    unknownIncrementBase: 2,
  },
} as const;

export const VARIETY_CONFIG = {
  consecutiveDirectionsLimit: 2,
  consecutiveTypesLimit: 2,
} as const;

export const SESSION_CONFIG = {
  STORAGE_VERSION: 1,
  SESSION_EXPIRE_HOURS: 24,
} as const;

export const SM2_CONFIG = {
  MIN_EASE_FACTOR: 1.3,
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 6,
} as const;

export const DEFAULT_LEARNING_SETTINGS = {
  maxNewWordsPerDay: 10,
  maxReviewsPerDay: 25,
  reviewAheadDays: 0,
  autoIntroduceNewWords: true,
  reviewOrder: "review-first" as const,
  introduceNewWordsWhenNoReviews: true,
} as const;

// Time estimation weights in minutes per word category
export const SESSION_TIME_ESTIMATIONS = {
  reviewMinutesPerWord: 0.5,
  learningMinutesPerWord: 1.0,
  newMinutesPerWord: 1.5,
} as const;
