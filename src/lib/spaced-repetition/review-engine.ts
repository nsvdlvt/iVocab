import {
  ReviewState,
  ReviewGrade,
  ReviewResult,
  SpacedRepetitionAlgorithm,
  ReviewForecastItem,
} from "./review-types";
import { SM2Algorithm } from "./review-algorithm";
import { stableSort } from "./review-utils";

export class ReviewEngine {
  private static defaultAlgorithm: SpacedRepetitionAlgorithm = new SM2Algorithm();

  // Expose configuration swap hooks for FSRS transition later
  static setAlgorithm(algo: SpacedRepetitionAlgorithm) {
    this.defaultAlgorithm = algo;
  }

  static review(
    reviewState: ReviewState,
    grade: ReviewGrade,
    now: Date
  ): ReviewResult {
    const nextState = this.defaultAlgorithm.calculateNextState({
      currentState: reviewState,
      grade,
      now,
    });

    const intervalChange = nextState.intervalDays - reviewState.intervalDays;
    const easeFactorChange = nextState.easeFactor - reviewState.easeFactor;

    const becameMastered = nextState.status === "mastered" && reviewState.status !== "mastered";
    const becameLearning = nextState.status === "learning" && reviewState.status !== "learning";
    const becameReview = nextState.status === "review" && reviewState.status !== "review";

    return {
      previous: reviewState,
      current: nextState,
      grade,
      intervalChange,
      easeFactorChange,
      becameMastered,
      becameLearning,
      becameReview,
    };
  }

  static getDueWords(states: ReviewState[], now: Date): ReviewState[] {
    const due = states.filter((s) => s.nextReviewAt.getTime() <= now.getTime());

    // Sorting algorithm:
    // 1. Overdue first (largest overdue time)
    // 2. Learning status first (lowest repetitions / priority)
    // 3. Oldest review first
    return stableSort(due, (a, b) => {
      // 1. Overdue level
      const overA = now.getTime() - a.nextReviewAt.getTime();
      const overB = now.getTime() - b.nextReviewAt.getTime();
      if (Math.abs(overA - overB) > 1000) {
        return overB - overA; // Descending order
      }

      // 2. Learning state repetitions
      if (a.repetitions !== b.repetitions) {
        return a.repetitions - b.repetitions; // Ascending order
      }

      // 3. Oldest last reviewed
      const lastA = a.lastReviewedAt ? a.lastReviewedAt.getTime() : 0;
      const lastB = b.lastReviewedAt ? b.lastReviewedAt.getTime() : 0;
      return lastA - lastB; // Ascending order
    });
  }

  static getDueCount(states: ReviewState[], now: Date): number {
    return states.filter((s) => s.nextReviewAt.getTime() <= now.getTime()).length;
  }

  static getLearningCount(states: ReviewState[]): number {
    return states.filter((s) => s.status === "learning").length;
  }

  static getMasteredCount(states: ReviewState[]): number {
    return states.filter((s) => s.status === "mastered").length;
  }

  static getReviewCount(states: ReviewState[]): number {
    return states.filter((s) => s.status === "review").length;
  }

  static getAverageEase(states: ReviewState[]): number {
    if (states.length === 0) return 0;
    const sum = states.reduce((acc, s) => acc + s.easeFactor, 0);
    return Math.round((sum / states.length) * 100) / 100;
  }

  static getAverageInterval(states: ReviewState[]): number {
    if (states.length === 0) return 0;
    const sum = states.reduce((acc, s) => acc + s.intervalDays, 0);
    return Math.round((sum / states.length) * 10) / 10;
  }

  static getRetentionRate(states: ReviewState[]): number {
    // Retention rate formula: 1 - lapses / total reviews
    if (states.length === 0) return 100;
    const totalRepetitions = states.reduce((acc, s) => acc + s.repetitions, 0);
    const totalLapses = states.reduce((acc, s) => acc + s.lapses, 0);
    const totalReviews = totalRepetitions + totalLapses;
    if (totalReviews === 0) return 100;
    const rate = 1 - totalLapses / totalReviews;
    return Math.round(rate * 100);
  }

  static getMasteredPercentage(states: ReviewState[]): number {
    if (states.length === 0) return 0;
    return Math.round((this.getMasteredCount(states) / states.length) * 100);
  }

  static getLearningPercentage(states: ReviewState[]): number {
    if (states.length === 0) return 0;
    return Math.round((this.getLearningCount(states) / states.length) * 100);
  }

  static getReviewForecast(states: ReviewState[], days: number, now: Date): ReviewForecastItem[] {
    const forecast: ReviewForecastItem[] = [];
    const baseTime = now.getTime();

    for (let d = 0; d < days; d++) {
      const forecastDay = new Date(baseTime);
      forecastDay.setDate(forecastDay.getDate() + d);
      // Clean time components for exact day matches
      forecastDay.setHours(23, 59, 59, 999);

      const dueAtDay = states.filter((s) => s.nextReviewAt.getTime() <= forecastDay.getTime()).length;
      forecast.push({
        date: new Date(baseTime + d * 24 * 60 * 60 * 1000),
        dueCount: dueAtDay,
      });
    }

    return forecast;
  }
}
