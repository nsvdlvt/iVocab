import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type StudySessionRow = Database["public"]["Tables"]["study_sessions"]["Row"];

export const StudySessionRepository = {
  /**
   * Finds a study session for the user that started within the given date range.
   */
  async findSessionInRange(userId: string, startIso: string, endIso: string): Promise<StudySessionRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", startIso)
      .lt("started_at", endIso)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error; // ignore no rows
    return data;
  },

  /**
   * Retrieves all study sessions for a user within a given date range.
   */
  async getSessionsInRange(userId: string, startIso: string, endIso: string): Promise<StudySessionRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", startIso)
      .lt("started_at", endIso)
      .order("started_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Retrieves all study sessions for a user.
   */
  async getAllSessions(userId: string): Promise<StudySessionRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Creates a new study session.
   */
  async createSession(session: Database["public"]["Tables"]["study_sessions"]["Insert"]): Promise<StudySessionRow> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing study session by ID.
   */
  async updateSession(id: string, updates: Partial<Database["public"]["Tables"]["study_sessions"]["Update"]>): Promise<StudySessionRow> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
