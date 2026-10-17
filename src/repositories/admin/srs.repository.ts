import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface SrsStats {
  totalReviews: number;
  dueToday: number;
  overdue: number;
  upcoming7Days: number;
  statusBreakdown: {
    new: number;
    learning: number;
    review: number;
    mastered: number;
  };
  averageEaseFactor: number;
  totalStudySessions: number;
  totalStudySeconds: number;
  totalWordsRemembered: number;
}

export class AdminSrsRepository {
  private static async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
  }

  static async getSrsOverview(): Promise<SrsStats> {
    const supabase = await this.getSupabase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalReviewsResult,
      overdueResult,
      dueTodayResult,
      upcomingResult,
      studySessionsResult,
    ] = await Promise.all([
      supabase.from("reviews").select("id, ease_factor, repetitions, status", { count: "exact" }).limit(500),
      supabase.from("reviews").select("id", { count: "exact", head: true }).lt("next_review", startOfToday),
      supabase.from("reviews").select("id", { count: "exact", head: true }).gte("next_review", startOfToday).lte("next_review", endOfToday),
      supabase.from("reviews").select("id", { count: "exact", head: true }).gt("next_review", endOfToday).lte("next_review", next7Days),
      supabase.from("study_sessions").select("study_seconds, remembered_words", { count: "exact" }).limit(500),
    ]);

    const reviews = totalReviewsResult.data || [];
    let sumEase = 0;
    const statusCounts = { new: 0, learning: 0, review: 0, mastered: 0 };

    for (const r of reviews) {
      sumEase += r.ease_factor || 2.5;
      const reps = r.repetitions || 0;
      if (reps === 0) statusCounts.new++;
      else if (reps < 3) statusCounts.learning++;
      else if (reps < 6) statusCounts.review++;
      else statusCounts.mastered++;
    }

    const avgEase = reviews.length > 0 ? Number((sumEase / reviews.length).toFixed(2)) : 2.5;

    const sessions = studySessionsResult.data || [];
    let totalSeconds = 0;
    let totalRemembered = 0;
    for (const s of sessions) {
      totalSeconds += s.study_seconds || 0;
      totalRemembered += s.remembered_words || 0;
    }

    return {
      totalReviews: totalReviewsResult.count || reviews.length,
      dueToday: dueTodayResult.count || 0,
      overdue: overdueResult.count || 0,
      upcoming7Days: upcomingResult.count || 0,
      statusBreakdown: statusCounts,
      averageEaseFactor: avgEase,
      totalStudySessions: studySessionsResult.count || sessions.length,
      totalStudySeconds: totalSeconds,
      totalWordsRemembered: totalRemembered,
    };
  }

  static async getRecentStudySessions(page: number = 1, pageSize: number = 10) {
    const supabase = await this.getSupabase();
    const { data, count, error } = await supabase
      .from("study_sessions")
      .select("*, profiles(id, email, display_name)", { count: "exact" })
      .order("started_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}
