import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database";
import { ensureReviewSessionSchema } from "./review-session-schema";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewSessionRow = Database["public"]["Tables"]["review_sessions"]["Row"];

export interface ReviewSession {
  id: string;
  vocabularySetId: string | null;
  title: string;
  description: string;
  words: VocabularyRow[];
  createdAt: string;
  expiresAt: string;
  completedWords: string[];
}

const REVIEW_SESSION_TTL_MS = 1000 * 60 * 60 * 6;

function toSession(row: ReviewSessionRow): ReviewSession {
  return {
    id: row.id,
    vocabularySetId: row.vocabulary_set_id ?? null,
    title: row.title,
    description: row.description,
    words: row.words as VocabularyRow[],
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    completedWords: row.completed_words ?? [],
  };
}

export const ReviewSessionStore = {
  async create(
    userId: string,
    words: VocabularyRow[],
    options: { vocabularySetId?: string | null; title?: string; description?: string } = {}
  ): Promise<ReviewSession> {
    await ensureReviewSessionSchema();
    const supabase = await createClient();
    const now = new Date();
    const payload = {
      id: randomUUID(),
      user_id: userId,
      vocabulary_set_id: options.vocabularySetId ?? null,
      title: options.title ?? "Ôn tập hôm nay",
      description: options.description ?? "Các từ được lên lịch để ôn hôm nay",
      words: words as Json,
      completed_words: [],
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REVIEW_SESSION_TTL_MS).toISOString(),
    };

    const { data, error } = await supabase
      .from("review_sessions")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error("Supabase insert returned no data");
    }
    return toSession(data);
  },

  async get(id: string): Promise<ReviewSession | null> {
    await ensureReviewSessionSchema();
    const supabase = await createClient();
    const { data, error } = await supabase.from("review_sessions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    if (new Date(data.expires_at).getTime() <= Date.now()) {
      const { error: deleteError } = await supabase.from("review_sessions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      return null;
    }

    return toSession(data);
  },

  async markCompleted(sessionId: string, vocabularyId: string): Promise<ReviewSession | null> {
    const session = await this.get(sessionId);
    if (!session) return null;

    const completedWords = session.completedWords.includes(vocabularyId)
      ? session.completedWords
      : [...session.completedWords, vocabularyId];

    await ensureReviewSessionSchema();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("review_sessions")
      .update({ completed_words: completedWords })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error("Supabase update returned no data");
    }
    return toSession(data);
  },

  async delete(id: string): Promise<void> {
    await ensureReviewSessionSchema();
    const supabase = await createClient();
    const { error } = await supabase.from("review_sessions").delete().eq("id", id);
    if (error) throw error;
  },

  isComplete(session: ReviewSession): boolean {
    return session.completedWords.length >= session.words.length && session.words.length > 0;
  },
};
