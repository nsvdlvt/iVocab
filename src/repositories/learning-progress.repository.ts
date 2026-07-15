import { createClient } from "@/lib/supabase/server";
import { LearningSource } from "@/lib/statistics/learning-progress.service";

export const LearningProgressRepository = {
  /**
   * Records learning progress atomically using a database RPC.
   */
  async recordProgress(userId: string, count: number, durationSeconds: number, source: LearningSource): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc("record_learning_progress", {
      p_user_id: userId,
      p_count: count,
      p_duration_seconds: durationSeconds,
      p_source: source
    });

    if (error) {
      throw error;
    }
  }
};
