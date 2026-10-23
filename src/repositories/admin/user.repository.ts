import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type UserStatisticsRow = Database["public"]["Tables"]["user_statistics"]["Row"];
export type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
export type QuizHistoryRow = Database["public"]["Tables"]["quiz_history"]["Row"];
export type StudySessionRow = Database["public"]["Tables"]["study_sessions"]["Row"];

export interface UserDetailData {
  profile: ProfileRow;
  statistics: UserStatisticsRow | null;
  vocabSets: Array<VocabSetRow & { word_count?: number }>;
  recentQuizzes: QuizHistoryRow[];
  recentStudySessions: StudySessionRow[];
  totalWordsLearned: number;
}

export class AdminUserRepository {
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

  static async getUsers(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    roleFilter?: "all" | "user" | "member" | "e_team" | "admin"
  ) {
    const supabase = await this.getSupabase();
    
    let query = supabase.from("profiles").select("*", { count: "exact" });
    
    if (roleFilter && roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
    }
    
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
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

  static async getUserById(id: string): Promise<UserDetailData | null> {
    const supabase = await this.getSupabase();
    
    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    // 2. Fetch User Statistics
    const { data: statistics } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();

    // 3. Fetch Vocab Sets owned by User
    const { data: sets } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    const vocabSetsWithCount: Array<VocabSetRow & { word_count?: number }> = [];
    if (sets && sets.length > 0) {
      for (const set of sets) {
        const { count } = await supabase
          .from("vocabularies")
          .select("id", { count: "exact", head: true })
          .eq("set_id", set.id);
        vocabSetsWithCount.push({
          ...set,
          word_count: count || 0,
        });
      }
    }

    // 4. Fetch Recent Quizzes
    const { data: recentQuizzes } = await supabase
      .from("quiz_history")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 5. Fetch Recent Study Sessions
    const { data: recentStudySessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", id)
      .order("started_at", { ascending: false })
      .limit(10);

    // 6. Calculate total words learned (words with reviews repetitions >= 3)
    const { count: learnedCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .gte("repetitions", 3);

    return {
      profile,
      statistics: statistics || null,
      vocabSets: vocabSetsWithCount,
      recentQuizzes: recentQuizzes || [],
      recentStudySessions: recentStudySessions || [],
      totalWordsLearned: learnedCount || statistics?.learned_words || 0,
    };
  }

  static async updateUserRole(userId: string, newRole: "user" | "member" | "e_team" | "admin"): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  static async updateUserMetadata(
    userId: string,
    updates: { display_name?: string; level?: string; daily_goal?: number }
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}
