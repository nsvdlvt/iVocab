import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { ReviewRepository } from "./review.repository";

type UserStatisticsRow = Database["public"]["Tables"]["user_statistics"]["Row"];

export interface DashboardStats {
  totalSets: number;
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  learningWords: number;
  todayReviewCount: number;
  streak: number;
  dailyGoal: number;
}

export interface StatisticsPageData {
  stats: UserStatisticsRow | null;
  totalSets: number;
  totalWords: number;
}

export const StatisticsRepository = {
  /** Returns combined statistics for the dashboard header cards. */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const supabase = await createClient();
    const srsSummary = await ReviewRepository.getSummary(userId);

    // 1. user_statistics row (may not exist yet)
    await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // 2. profile for streak + daily goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak, daily_goal")
      .eq("id", userId)
      .maybeSingle();

    // 3. vocab_sets count (non-deleted)
    const { count: setsCount } = await supabase
      .from("vocab_sets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    // 4. vocabularies count (non-deleted)
    const { count: wordsCount } = await supabase
      .from("vocabularies")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .is("deleted_at", null);

    return {
      totalSets: setsCount ?? 0,
      totalWords: wordsCount ?? 0,
      learnedWords: srsSummary.learningWords,
      masteredWords: srsSummary.masteredWords,
      learningWords: srsSummary.learningWords,
      todayReviewCount: srsSummary.dueToday,
      streak: profile?.streak ?? 0,
      dailyGoal: profile?.daily_goal ?? 20,
    };
  },

  /** Returns statistics page data. */
  async getStatisticsPageData(userId: string): Promise<StatisticsPageData> {
    const supabase = await createClient();

    const { data: stats } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { count: setsCount } = await supabase
      .from("vocab_sets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    const { count: wordsCount } = await supabase
      .from("vocabularies")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .is("deleted_at", null);

    return {
      stats: stats ?? null,
      totalSets: setsCount ?? 0,
      totalWords: wordsCount ?? 0,
    };
  },
};
