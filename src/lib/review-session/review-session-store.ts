import { randomUUID } from "crypto";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

export interface ReviewSession {
  id: string;
  title: string;
  description: string;
  words: VocabularyRow[];
  createdAt: string;
  expiresAt: string;
  completedWords: string[];
}

const REVIEW_SESSION_TTL_MS = 1000 * 60 * 60 * 6;

declare global {
  var __reviewSessions: Map<string, ReviewSession> | undefined;
}

const store = globalThis.__reviewSessions ?? new Map<string, ReviewSession>();
globalThis.__reviewSessions = store;

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of store.entries()) {
    if (new Date(session.expiresAt).getTime() <= now) {
      store.delete(id);
    }
  }
}

export const ReviewSessionStore = {
  create(words: VocabularyRow[]): ReviewSession {
    cleanupExpiredSessions();

    const now = new Date();
    const session: ReviewSession = {
      id: randomUUID(),
      title: "Ôn tập hôm nay",
      description: "Các từ được lên lịch để ôn hôm nay",
      words,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + REVIEW_SESSION_TTL_MS).toISOString(),
      completedWords: [],
    };

    store.set(session.id, session);
    return session;
  },

  get(id: string): ReviewSession | null {
    cleanupExpiredSessions();
    return store.get(id) ?? null;
  },

  markCompleted(sessionId: string, vocabularyId: string): ReviewSession | null {
    const session = this.get(sessionId);
    if (!session) return null;
    if (!session.completedWords.includes(vocabularyId)) {
      session.completedWords = [...session.completedWords, vocabularyId];
    }
    store.set(sessionId, session);
    return session;
  },

  delete(id: string): void {
    store.delete(id);
  },

  isComplete(session: ReviewSession): boolean {
    return session.completedWords.length >= session.words.length && session.words.length > 0;
  },
};
