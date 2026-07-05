import { ReviewState } from "./review-types";
import { LearningSettings } from "./learning-settings";
import { SESSION_TIME_ESTIMATIONS } from "../learning/config";

export interface TodayReviewQueue {
  review: ReviewState[];
  learning: ReviewState[];
  newWords: ReviewState[];
  total: number;
  estimatedMinutes: number;
}

export interface StudySession {
  queue: ReviewState[];
  summary: {
    total: number;
    reviewCount: number;
    learningCount: number;
    newCount: number;
    estimatedMinutes: number;
  };
}

export class ReviewScheduler {
  static buildTodayQueue(params: {
    states: ReviewState[];
    settings: LearningSettings;
    now: Date;
  }): TodayReviewQueue {
    const { states, settings, now } = params;

    // 1. Filter and categorize words.
    // Review: nextReviewAt <= now, repetitions > 0, status is "review" or "mastered"
    // Learning: status is "learning", repetitions > 0
    // New: repetitions = 0, status is "new"
    
    // De-duplication helper: Track added vocabularyIds to avoid duplicate items
    const visitedIds = new Set<string>();

    const rawReviews = states.filter(
      (s) =>
        s.nextReviewAt.getTime() <= now.getTime() &&
        s.repetitions > 0 &&
        (s.status === "review" || s.status === "mastered")
    );

    const rawLearning = states.filter(
      (s) => s.repetitions > 0 && s.status === "learning"
    );

    const rawNew = states.filter(
      (s) => s.repetitions === 0 || s.status === "new"
    );

    // Apply strict Priority de-duplication: Review > Learning > New
    const reviews: ReviewState[] = [];
    for (const r of rawReviews) {
      if (!visitedIds.has(r.vocabularyId)) {
        visitedIds.add(r.vocabularyId);
        reviews.push(r);
      }
    }

    const learning: ReviewState[] = [];
    for (const l of rawLearning) {
      if (!visitedIds.has(l.vocabularyId)) {
        visitedIds.add(l.vocabularyId);
        learning.push(l);
      }
    }

    const newWords: ReviewState[] = [];
    for (const n of rawNew) {
      if (!visitedIds.has(n.vocabularyId)) {
        visitedIds.add(n.vocabularyId);
        newWords.push(n);
      }
    }

    // Sort stably according to oldest overdue dates or priority before slicing
    reviews.sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
    learning.sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());

    // Apply configurable limits
    const slicedReviews = reviews.slice(0, settings.maxReviewsPerDay);
    
    let slicedNew: ReviewState[] = [];
    if (settings.autoIntroduceNewWords) {
      if (slicedReviews.length > 0 || settings.introduceNewWordsWhenNoReviews) {
        slicedNew = newWords.slice(0, settings.maxNewWordsPerDay);
      }
    }

    const totalCount = slicedReviews.length + learning.length + slicedNew.length;

    // Pre-calculate estimated minutes using configurable weights
    const estimatedMinutes =
      slicedReviews.length * SESSION_TIME_ESTIMATIONS.reviewMinutesPerWord +
      learning.length * SESSION_TIME_ESTIMATIONS.learningMinutesPerWord +
      slicedNew.length * SESSION_TIME_ESTIMATIONS.newMinutesPerWord;

    return {
      review: slicedReviews,
      learning,
      newWords: slicedNew,
      total: totalCount,
      estimatedMinutes: Math.ceil(estimatedMinutes),
    };
  }

  static buildStudySession(params: {
    todayQueue: TodayReviewQueue;
    settings: LearningSettings;
  }): StudySession {
    const { todayQueue, settings } = params;

    let finalQueue: ReviewState[] = [];

    // Order combinations based on preferences
    if (settings.reviewOrder === "review-first") {
      finalQueue = [
        ...todayQueue.review,
        ...todayQueue.learning,
        ...todayQueue.newWords,
      ];
    } else if (settings.reviewOrder === "new-first") {
      finalQueue = [
        ...todayQueue.newWords,
        ...todayQueue.learning,
        ...todayQueue.review,
      ];
    } else {
      // "mixed" mode: mix items in a balanced interleaved pattern
      const maxLen = Math.max(
        todayQueue.review.length,
        todayQueue.learning.length,
        todayQueue.newWords.length
      );

      for (let i = 0; i < maxLen; i++) {
        if (i < todayQueue.review.length) finalQueue.push(todayQueue.review[i]);
        if (i < todayQueue.learning.length) finalQueue.push(todayQueue.learning[i]);
        if (i < todayQueue.newWords.length) finalQueue.push(todayQueue.newWords[i]);
      }
    }

    return {
      queue: finalQueue,
      summary: {
        total: todayQueue.total,
        reviewCount: todayQueue.review.length,
        learningCount: todayQueue.learning.length,
        newCount: todayQueue.newWords.length,
        estimatedMinutes: todayQueue.estimatedMinutes,
      },
    };
  }
}
