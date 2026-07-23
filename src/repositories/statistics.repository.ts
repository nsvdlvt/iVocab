import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { ReviewRepository } from "./review.repository";
import { StudySessionRepository } from "./study-session.repository";
import { ProfileRepository } from "./profile.repository";
import { calculateCurrentStreak, getActiveStudyDaysMap } from "@/lib/streak";
import { VocabularyStatsService, type VocabularyStats } from "@/lib/statistics/vocabulary-stats.service";

type UserStatisticsRow = Database["public"]["Tables"]["user_statistics"]["Row"];

export interface DailyProgress {
  studiedWords: number;
  reviewedWords: number;
  goal: number;
  progressPercent: number;
}

export interface DailyActivity {
  date: string;
  studiedWords: number;
  reviewedWords: number;
  studySeconds: number;
  progress: number;
  completed: boolean;
}

export interface TodaySummary {
  studiedWords: number;
  reviewedWords: number;
  studySeconds: number;
  quizzesCompleted: number;
  dictationsCompleted: number;
  sentencesCompleted: number;
}

export interface DashboardStats {
  totalSets: number;
  totalWords: number;
  dashboardVocabularyStats: VocabularyStats;
  masteredWords: number;
  learningWords: number;
  todayReviewCount: number;
  streak: number;
  dailyProgress: DailyProgress;
  weeklyActivity: DailyActivity[];
  todaySummary: TodaySummary;
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
    
    // Concurrently fetch necessary data
    const [summary, vocabularyStats, profile, setsCountResult, wordsCountResult] = await Promise.all([
      ReviewRepository.getSummary(userId),
      ReviewRepository.getDashboardVocabularyStats(userId),
      ProfileRepository.getProfile(userId),
      supabase
        .from("vocab_sets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("vocabularies")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .is("deleted_at", null),
    ]);

    const dailyGoal = profile?.daily_goal ?? 20;

    // Build weekly activity
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const sessions = await StudySessionRepository.getSessionsInRange(
      userId, 
      startOfWeek.toISOString(), 
      endOfWeek.toISOString()
    );
    const allSessions = await StudySessionRepository.getAllSessions(userId);
    const activeStudyDays = getActiveStudyDaysMap(allSessions);
    const streak = calculateCurrentStreak(allSessions, now);

    const weeklyActivity: DailyActivity[] = [];
    let todayStudiedWords = 0;
    let todayReviewedWords = 0;
    let todayTotalActivity = 0;
    const todayStr = now.toDateString();

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayKey = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).getTime();
      const session = sessions.find(s => new Date(s.started_at).toDateString() === d.toDateString());
      
      const studied = session?.studied_words ?? 0;
      const reviewed = session?.reviews_completed ?? 0;
      const studySeconds = session?.study_seconds ?? 0;
      const totalDailyActivity = studied + reviewed + (session?.quizzes_completed ?? 0) + (session?.dictations_completed ?? 0) + (session?.sentences_completed ?? 0);
      const completed = activeStudyDays.has(dayKey) && totalDailyActivity >= dailyGoal;
      const progress = dailyGoal > 0 ? Math.min(Math.round((totalDailyActivity / dailyGoal) * 100), 100) : 0;
      
      weeklyActivity.push({
        date: d.toISOString(),
        studiedWords: studied,
        reviewedWords: reviewed,
        studySeconds,
        progress,
        completed
      });

      if (d.toDateString() === todayStr) {
        todayStudiedWords = studied;
        todayReviewedWords = reviewed;
        todayTotalActivity = totalDailyActivity;
      }
    }

    const todaySession = sessions.find(s => new Date(s.started_at).toDateString() === todayStr);

    const todaySummary: TodaySummary = {
      studiedWords: todaySession?.studied_words ?? 0,
      reviewedWords: todaySession?.reviews_completed ?? 0,
      studySeconds: todaySession?.study_seconds ?? 0,
      quizzesCompleted: todaySession?.quizzes_completed ?? 0,
      dictationsCompleted: todaySession?.dictations_completed ?? 0,
      sentencesCompleted: todaySession?.sentences_completed ?? 0,
    };

    const dailyProgress: DailyProgress = {
      studiedWords: todayStudiedWords,
      reviewedWords: todayReviewedWords,
      goal: dailyGoal,
      progressPercent: dailyGoal > 0 ? Math.min(Math.round((todayTotalActivity / dailyGoal) * 100), 100) : 0,
    };

    return {
      totalSets: setsCountResult.count ?? 0,
      totalWords: wordsCountResult.count ?? 0,
      dashboardVocabularyStats: vocabularyStats,
      masteredWords: summary.masteredWords,
      learningWords: summary.learningWords,
      todayReviewCount: summary.dueToday,
      streak,
      dailyProgress,
      weeklyActivity,
      todaySummary
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

    const vocabularyStats = await VocabularyStatsService.getUserVocabularyStats(userId);
    const wordsCount = vocabularyStats.totalWords;

    return {
      stats: stats ?? null,
      totalSets: setsCount ?? 0,
      totalWords: wordsCount,
    };
  },
};
