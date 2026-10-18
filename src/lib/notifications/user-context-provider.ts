import { Client } from "pg";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface UserContextData {
  // A. User
  name: string;
  email: string;
  streak: number;
  longest_streak: number;
  last_study_date: string;
  days_inactive: number;
  timezone: string;

  // B. Learning
  word_count: number;
  words_learned_today: number;
  words_review_due: number;
  words_reviewed_today: number;
  words_mastered: number;
  learning_goal: number;
  goal_progress: string;
  goal_remaining: number;
  study_minutes_today: number;

  // C. Quiz
  quiz_count: number;
  quizzes_today: number;
  last_quiz_score: string;
  best_quiz_score: string;
  quiz_accuracy: string;
  pending_tasks: number;

  // D. System
  app_name: string;
  current_date: string;
  current_time: string;
  notification_link: string;
  review_link: string;
  learn_link: string;
  quiz_link: string;

  [key: string]: unknown;
}

export class UserContextProvider {
  private static getDatabaseClient(): InstanceType<typeof Client> | null {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;
    return new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  /**
   * Fetches real user context for a single user ID.
   */
  static async getUserContext(userId: string): Promise<UserContextData | null> {
    const batch = await this.getUserContextsBatch([userId]);
    return batch.get(userId) || null;
  }

  /**
   * Batch fetches user context data for multiple users in a single/few queries.
   * Completely avoids N+1 query performance traps.
   */
  static async getUserContextsBatch(
    userIds: string[]
  ): Promise<Map<string, UserContextData>> {
    const results = new Map<string, UserContextData>();
    if (!userIds || userIds.length === 0) return results;

    const uniqueIds = Array.from(new Set(userIds));
    const now = new Date();

    // Use Postgres Client if available for batch aggregation
    const pgClient = this.getDatabaseClient();
    if (pgClient) {
      try {
        await pgClient.connect();

        // 1. Fetch Profiles + Preferences
        const profileSql = `
          SELECT 
            p.id, p.email, p.display_name, p.streak, p.longest_streak, p.daily_goal, p.last_activity_at,
            pref.timezone
          FROM public.profiles p
          LEFT JOIN public.notification_user_preferences pref ON pref.user_id = p.id
          WHERE p.id = ANY($1::uuid[])
        `;
        const profileRes = await pgClient.query(profileSql, [uniqueIds]);

        // 2. Fetch Total Words count per user
        const wordsSql = `
          SELECT owner_id AS user_id, COUNT(*)::int AS word_count
          FROM public.vocabularies
          WHERE owner_id = ANY($1::uuid[]) AND deleted_at IS NULL
          GROUP BY owner_id
        `;
        const wordsRes = await pgClient.query(wordsSql, [uniqueIds]);
        const wordCountMap = new Map<string, number>();
        for (const row of wordsRes.rows) {
          wordCountMap.set(row.user_id, Number(row.word_count || 0));
        }

        // 3. Fetch Reviews stats (Due now + Mastered count)
        const reviewsSql = `
          SELECT 
            user_id,
            COUNT(*) FILTER (WHERE next_review <= now())::int AS due_count,
            COUNT(*) FILTER (WHERE status IN ('lv5', 'mastered'))::int AS mastered_count
          FROM public.reviews
          WHERE user_id = ANY($1::uuid[])
          GROUP BY user_id
        `;
        const reviewsRes = await pgClient.query(reviewsSql, [uniqueIds]);
        const reviewStatsMap = new Map<string, { due: number; mastered: number }>();
        for (const row of reviewsRes.rows) {
          reviewStatsMap.set(row.user_id, {
            due: Number(row.due_count || 0),
            mastered: Number(row.mastered_count || 0),
          });
        }

        // 4. Fetch Today's Study Sessions (UTC truncated day)
        const sessionsSql = `
          SELECT 
            user_id,
            COALESCE(SUM(studied_words), 0)::int AS studied_today,
            COALESCE(SUM(reviews_completed), 0)::int AS reviews_today,
            COALESCE(SUM(quizzes_completed), 0)::int AS quizzes_today,
            COALESCE(SUM(study_seconds), 0)::int AS seconds_today
          FROM public.study_sessions
          WHERE user_id = ANY($1::uuid[])
            AND started_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
          GROUP BY user_id
        `;
        const sessionsRes = await pgClient.query(sessionsSql, [uniqueIds]);
        const sessionMap = new Map<
          string,
          { studied: number; reviewed: number; quizzes: number; seconds: number }
        >();
        for (const row of sessionsRes.rows) {
          sessionMap.set(row.user_id, {
            studied: Number(row.studied_today || 0),
            reviewed: Number(row.reviews_today || 0),
            quizzes: Number(row.quizzes_today || 0),
            seconds: Number(row.seconds_today || 0),
          });
        }

        // 5. Fetch Quiz History Aggregates (Total count, total correct, total questions, max score)
        const quizSql = `
          SELECT 
            user_id,
            COUNT(*)::int AS total_quizzes,
            COALESCE(SUM(correct_answers), 0)::int AS total_correct,
            COALESCE(SUM(total_questions), 0)::int AS total_questions,
            MAX(score)::int AS best_score
          FROM public.quiz_history
          WHERE user_id = ANY($1::uuid[])
          GROUP BY user_id
        `;
        const quizRes = await pgClient.query(quizSql, [uniqueIds]);
        const quizStatsMap = new Map<
          string,
          { total: number; correct: number; questions: number; best: number }
        >();
        for (const row of quizRes.rows) {
          quizStatsMap.set(row.user_id, {
            total: Number(row.total_quizzes || 0),
            correct: Number(row.total_correct || 0),
            questions: Number(row.total_questions || 0),
            best: Number(row.best_score || 0),
          });
        }

        // 6. Fetch Most Recent Quiz score per user
        const recentQuizSql = `
          SELECT DISTINCT ON (user_id) user_id, score, correct_answers, total_questions
          FROM public.quiz_history
          WHERE user_id = ANY($1::uuid[])
          ORDER BY user_id, created_at DESC
        `;
        const recentQuizRes = await pgClient.query(recentQuizSql, [uniqueIds]);
        const recentQuizMap = new Map<string, string>();
        for (const row of recentQuizRes.rows) {
          recentQuizMap.set(
            row.user_id,
            row.total_questions > 0
              ? `${row.correct_answers}/${row.total_questions}`
              : `${row.score}đ`
          );
        }

        // Build composite user context data
        for (const p of profileRes.rows) {
          const uId = p.id;
          const userTimezone = p.timezone || "Asia/Ho_Chi_Minh";

          // Format current date and time
          const dateStr = now.toLocaleDateString("vi-VN", { timeZone: userTimezone });
          const timeStr = now.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: userTimezone,
          });

          // Last study date & inactive days
          let lastStudyDateStr = "Chưa có";
          let daysInactive = 0;
          if (p.last_activity_at) {
            const lastDate = new Date(p.last_activity_at);
            lastStudyDateStr = lastDate.toLocaleDateString("vi-VN", {
              timeZone: userTimezone,
            });
            const diffMs = now.getTime() - lastDate.getTime();
            daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          }

          const wordCount = wordCountMap.get(uId) || 0;
          const reviewStats = reviewStatsMap.get(uId) || { due: 0, mastered: 0 };
          const sessionStats = sessionMap.get(uId) || {
            studied: 0,
            reviewed: 0,
            quizzes: 0,
            seconds: 0,
          };
          const quizStats = quizStatsMap.get(uId) || {
            total: 0,
            correct: 0,
            questions: 0,
            best: 0,
          };

          const dailyGoal = Number(p.daily_goal) || 20;
          const totalActivityToday = sessionStats.studied + sessionStats.reviewed;
          const progressRatio = dailyGoal > 0 ? (totalActivityToday / dailyGoal) * 100 : 0;
          const goalProgress = `${Math.min(100, Math.round(progressRatio))}%`;
          const goalRemaining = Math.max(0, dailyGoal - totalActivityToday);

          const quizAccuracy =
            quizStats.questions > 0
              ? `${Math.round((quizStats.correct / quizStats.questions) * 100)}%`
              : "0%";

          const userContext: UserContextData = {
            name: p.display_name?.trim() || "Học viên",
            email: p.email || "",
            streak: Number(p.streak) || 0,
            longest_streak: Number(p.longest_streak) || Number(p.streak) || 0,
            last_study_date: lastStudyDateStr,
            days_inactive: daysInactive,
            timezone: userTimezone,

            word_count: wordCount,
            words_learned_today: sessionStats.studied,
            words_review_due: reviewStats.due,
            words_reviewed_today: sessionStats.reviewed,
            words_mastered: reviewStats.mastered,
            learning_goal: dailyGoal,
            goal_progress: goalProgress,
            goal_remaining: goalRemaining,
            study_minutes_today: Math.round(sessionStats.seconds / 60),

            quiz_count: quizStats.total,
            quizzes_today: sessionStats.quizzes,
            last_quiz_score: recentQuizMap.get(uId) || "Chưa có",
            best_quiz_score: quizStats.best > 0 ? `${quizStats.best}đ` : "Chưa có",
            quiz_accuracy: quizAccuracy,
            pending_tasks: reviewStats.due + goalRemaining,

            app_name: "Vocabee",
            current_date: dateStr,
            current_time: timeStr,
            notification_link: "/notifications",
            review_link: "/review",
            learn_link: "/vocabulary",
            quiz_link: "/quiz",
          };

          results.set(uId, userContext);
        }

        return results;
      } finally {
        await pgClient.end().catch(() => undefined);
      }
    }

    // Fallback: Use Supabase Client if PG client is unavailable
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => {},
          },
        }
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name, streak, longest_streak, daily_goal, last_activity_at")
        .in("id", uniqueIds);

      if (profiles) {
        for (const p of profiles) {
          const userContext: UserContextData = {
            name: p.display_name?.trim() || "Học viên",
            email: p.email || "",
            streak: p.streak || 0,
            longest_streak: p.longest_streak || p.streak || 0,
            last_study_date: p.last_activity_at
              ? new Date(p.last_activity_at).toLocaleDateString("vi-VN")
              : "Chưa có",
            days_inactive: 0,
            timezone: "Asia/Ho_Chi_Minh",

            word_count: 0,
            words_learned_today: 0,
            words_review_due: 0,
            words_reviewed_today: 0,
            words_mastered: 0,
            learning_goal: p.daily_goal || 20,
            goal_progress: "0%",
            goal_remaining: p.daily_goal || 20,
            study_minutes_today: 0,

            quiz_count: 0,
            quizzes_today: 0,
            last_quiz_score: "Chưa có",
            best_quiz_score: "Chưa có",
            quiz_accuracy: "0%",
            pending_tasks: p.daily_goal || 20,

            app_name: "Vocabee",
            current_date: now.toLocaleDateString("vi-VN"),
            current_time: now.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            notification_link: "/notifications",
            review_link: "/review",
            learn_link: "/vocabulary",
            quiz_link: "/quiz",
          };
          results.set(p.id, userContext);
        }
      }
    } catch (err) {
      console.error("UserContextProvider fallback error:", err);
    }

    return results;
  }
}
