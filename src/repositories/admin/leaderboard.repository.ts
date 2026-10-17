import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface LeaderboardUser {
  rank: number;
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  level: string;
  score: number;
  secondaryScore?: number;
}

export interface AnomalyRecord {
  id: string;
  email: string;
  displayName: string;
  issue: string;
  metric: string;
  value: number | string;
}

export class AdminLeaderboardRepository {
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

  static async getStreakLeaders(limit: number = 20): Promise<LeaderboardUser[]> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, level, streak, longest_streak")
      .order("streak", { ascending: false, nullsFirst: false })
      .limit(limit);

    return (data || []).map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      email: p.email,
      displayName: p.display_name || p.email.split("@")[0],
      avatarUrl: p.avatar_url,
      level: p.level || "Basic (A1)",
      score: p.streak || 0,
      secondaryScore: p.longest_streak || 0,
    }));
  }

  static async getLearnedWordsLeaders(limit: number = 20): Promise<LeaderboardUser[]> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("user_statistics")
      .select("learned_words, total_words, profiles(id, email, display_name, avatar_url, level)")
      .order("learned_words", { ascending: false, nullsFirst: false })
      .limit(limit);

    return (data || [])
      .filter((d) => d.profiles)
      .map((d, idx) => {
        const p = d.profiles as any;
        return {
          rank: idx + 1,
          id: p.id,
          email: p.email,
          displayName: p.display_name || p.email.split("@")[0],
          avatarUrl: p.avatar_url,
          level: p.level || "Basic (A1)",
          score: d.learned_words || 0,
          secondaryScore: d.total_words || 0,
        };
      });
  }

  static async getStudyTimeLeaders(limit: number = 20): Promise<LeaderboardUser[]> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("user_statistics")
      .select("total_study_time, review_count, profiles(id, email, display_name, avatar_url, level)")
      .order("total_study_time", { ascending: false, nullsFirst: false })
      .limit(limit);

    return (data || [])
      .filter((d) => d.profiles)
      .map((d, idx) => {
        const p = d.profiles as any;
        return {
          rank: idx + 1,
          id: p.id,
          email: p.email,
          displayName: p.display_name || p.email.split("@")[0],
          avatarUrl: p.avatar_url,
          level: p.level || "Basic (A1)",
          score: Math.round((d.total_study_time || 0) / 60), // in minutes
          secondaryScore: d.review_count || 0,
        };
      });
  }

  static async getAnomalies(): Promise<AnomalyRecord[]> {
    const supabase = await this.getSupabase();
    const anomalies: AnomalyRecord[] = [];

    // Check for extreme streaks (> 500 days)
    const { data: extremeStreaks } = await supabase
      .from("profiles")
      .select("id, email, display_name, streak, last_activity_at")
      .gt("streak", 500)
      .limit(10);

    if (extremeStreaks) {
      for (const p of extremeStreaks) {
        anomalies.push({
          id: p.id,
          email: p.email,
          displayName: p.display_name || p.email,
          issue: "Streak bất thường (> 500 ngày)",
          metric: "Streak",
          value: p.streak || 0,
        });
      }
    }

    // Check for extreme study times (> 100,000 minutes)
    const { data: extremeTimes } = await supabase
      .from("user_statistics")
      .select("total_study_time, profiles(id, email, display_name)")
      .gt("total_study_time", 6000000)
      .limit(10);

    if (extremeTimes) {
      for (const t of extremeTimes) {
        const p = t.profiles as any;
        if (p) {
          anomalies.push({
            id: p.id,
            email: p.email,
            displayName: p.display_name || p.email,
            issue: "Thời gian học cực cao không bình thường",
            metric: "Study Seconds",
            value: t.total_study_time || 0,
          });
        }
      }
    }

    return anomalies;
  }
}
