import { createClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database";

export type LearningSessionRow = Database["public"]["Tables"]["learning_sessions"]["Row"];
export type LearningSessionInsert = Database["public"]["Tables"]["learning_sessions"]["Insert"];
export type LearningSessionUpdate = Database["public"]["Tables"]["learning_sessions"]["Update"];

export const LearningSessionRepository = {
  /**
   * Retrieves the current active unfinished session for a user and vocabulary set.
   */
  async getActiveSession(userId: string, setId: string): Promise<LearningSessionRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("vocabulary_set_id", setId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[LearningSessionRepository.getActiveSession] Error:", error);
      throw error;
    }
    return data;
  },

  /**
   * Retrieves a specific learning session by ID, scoped to user.
   */
  async getSessionById(sessionId: string, userId: string): Promise<LearningSessionRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[LearningSessionRepository.getSessionById] Error:", error);
      throw error;
    }
    return data;
  },

  /**
   * Creates a new learning session. Atomically marks any previous active session as 'abandoned'.
   */
  async createSession(
    userId: string,
    setId: string,
    payload: Omit<LearningSessionInsert, "user_id" | "vocabulary_set_id" | "status">
  ): Promise<LearningSessionRow> {
    const supabase = await createClient();

    // 1. Invalidate any existing active session for this user and set
    await supabase
      .from("learning_sessions")
      .update({
        status: "abandoned",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("vocabulary_set_id", setId)
      .eq("status", "active");

    // 2. Insert new session
    const insertPayload: LearningSessionInsert = {
      ...payload,
      user_id: userId,
      vocabulary_set_id: setId,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("learning_sessions")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[LearningSessionRepository.createSession] Error:", error);
      throw error || new Error("Failed to insert learning session");
    }

    return data;
  },

  /**
   * Updates an existing session with new checkpoint state.
   */
  async updateSession(
    sessionId: string,
    userId: string,
    updates: Partial<LearningSessionUpdate>
  ): Promise<LearningSessionRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_sessions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[LearningSessionRepository.updateSession] Error:", error);
      throw error;
    }
    return data;
  },

  /**
   * Safely abandons the active session when a user requests "Tạo lại bài".
   */
  async abandonActiveSession(userId: string, setId: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("learning_sessions")
      .update({
        status: "abandoned",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("vocabulary_set_id", setId)
      .eq("status", "active");

    if (error) {
      console.error("[LearningSessionRepository.abandonActiveSession] Error:", error);
      throw error;
    }
    return true;
  },

  /**
   * Marks a session as completed with final summary results.
   * Session is no longer active or resumable.
   */
  async completeSession(
    sessionId: string,
    userId: string,
    summary: Json,
    isMasteryUpdated = false
  ): Promise<LearningSessionRow | null> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("learning_sessions")
      .update({
        status: "completed",
        stage: "results",
        summary,
        is_mastery_updated: isMasteryUpdated,
        completed_at: now,
        updated_at: now,
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[LearningSessionRepository.completeSession] Error:", error);
      throw error;
    }
    return data;
  },

  /**
   * Sets is_mastery_updated to true for idempotency.
   */
  async markMasteryUpdated(sessionId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("learning_sessions")
      .update({
        is_mastery_updated: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("[LearningSessionRepository.markMasteryUpdated] Error:", error);
      throw error;
    }
  },
};
