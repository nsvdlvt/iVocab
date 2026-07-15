import { EventBus } from "@/lib/events/event-bus";
import { LearningProgressRepository } from "@/repositories/learning-progress.repository";

export type LearningSource = 'learn' | 'review' | 'quiz' | 'dictation' | 'sentence';

export const LearningProgressService = {
  /**
   * Single entry point to record learning progress.
   * Internally calls an RPC to atomically update study_sessions and profiles.streak.
   */
  async recordActivity(
    userId: string,
    count: number,
    durationSeconds: number = 0,
    source: LearningSource = 'learn'
  ): Promise<void> {
    try {
      await LearningProgressRepository.recordProgress(userId, count, durationSeconds, source);
    } catch (error) {
      console.error("Failed to record learning progress:", error);
      throw new Error("Failed to record learning progress");
    }

    // Dispatch event so other modules (e.g., achievements) can react
    await EventBus.publish({
      type: 'LEARNING_ACTIVITY_RECORDED',
      payload: {
        userId,
        count,
        durationSeconds,
        source
      }
    });
  }
};
