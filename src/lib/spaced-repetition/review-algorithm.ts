import { ReviewState, ReviewGrade, SpacedRepetitionAlgorithm } from "./review-types";
import { SM2_CONFIG } from "../learning/config";

export class SM2Algorithm implements SpacedRepetitionAlgorithm {
  calculateNextState(params: {
    currentState: ReviewState;
    grade: ReviewGrade;
    now: Date;
  }): ReviewState {
    const { currentState, grade, now } = params;
    
    // Copy current state
    const nextState = { ...currentState };
    nextState.lastReviewedAt = now;

    // SM-2 calculation mapping grade to quality levels
    // SM-2 quality ranges: Again = 0-2, Hard = 3, Good = 4, Easy = 5
    let q = 4;
    if (grade === ReviewGrade.Again) q = 1;
    else if (grade === ReviewGrade.Hard) q = 3;
    else if (grade === ReviewGrade.Good) q = 4;
    else if (grade === ReviewGrade.Easy) q = 5;

    if (grade === ReviewGrade.Again) {
      // Forgot response
      nextState.repetitions = 0;
      nextState.intervalDays = SM2_CONFIG.FIRST_INTERVAL;
      nextState.lapses = currentState.lapses + 1;
      nextState.status = "learning";

      // EF penalty
      nextState.easeFactor = Math.max(
        SM2_CONFIG.MIN_EASE_FACTOR,
        currentState.easeFactor - 0.2
      );
    } else {
      // Successful response
      const nextRepetitions = currentState.repetitions + 1;
      nextState.repetitions = nextRepetitions;

      // Calculate interval days
      if (nextRepetitions === 1) {
        nextState.intervalDays = SM2_CONFIG.FIRST_INTERVAL;
      } else if (nextRepetitions === 2) {
        nextState.intervalDays = SM2_CONFIG.SECOND_INTERVAL;
      } else {
        nextState.intervalDays = Math.ceil(currentState.intervalDays * currentState.easeFactor);
      }

      // Calculate Ease Factor shift
      const efChange = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
      nextState.easeFactor = Math.max(
        SM2_CONFIG.MIN_EASE_FACTOR,
        currentState.easeFactor + efChange
      );

      // Status resolution
      if (q === 5) {
        nextState.status = "mastered";
      } else if (nextRepetitions >= 4) {
        nextState.status = "review";
      } else {
        nextState.status = "learning";
      }
    }

    // Set next review timestamp
    const nextReviewDate = new Date(now.getTime());
    nextReviewDate.setDate(nextReviewDate.getDate() + nextState.intervalDays);
    nextState.nextReviewAt = nextReviewDate;

    return nextState;
  }
}
