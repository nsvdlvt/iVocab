// src/lib/ai/agent/tools/shared.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "@/lib/supabase/server";
import { SrsService } from "@/lib/srs/srs-service";
import { normalizeVocabularyWord } from "@/lib/validation/vocabulary-duplicates";
import type { Database } from "@/types/database";
import type { AgentResultCard, PendingConfirmation } from "../types";

export type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
export type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface ToolExecutionOutput {
  data: unknown;
  summary: string;
  error?: string;
  confirmations?: PendingConfirmation[];
  cards?: AgentResultCard[];
}

export interface ScopedWordRecord extends VocabularyRow {
  setTitle: string;
  review: ReviewRow | null;
  srsLevel: number;
  masteryGroup: "new" | "learning" | "learned" | "mastered";
}

export interface ToolExecutionContext {
  userId: string;
  getSets: () => Promise<VocabSetRow[]>;
  getWords: () => Promise<ScopedWordRecord[]>;
}

const toolContextStorage = new AsyncLocalStorage<ToolExecutionContext>();

export function createToolExecutionContext(userId: string): ToolExecutionContext {
  let setsPromise: Promise<VocabSetRow[]> | null = null;
  let wordsPromise: Promise<ScopedWordRecord[]> | null = null;

  return {
    userId,
    getSets: () => {
      if (!setsPromise) {
        setsPromise = queryAllUserActiveSets(userId).catch((err) => {
          setsPromise = null;
          throw err;
        });
      }
      return setsPromise;
    },
    getWords: () => {
      if (!wordsPromise) {
        wordsPromise = queryAllUserActiveWords(userId).catch((err) => {
          wordsPromise = null;
          throw err;
        });
      }
      return wordsPromise;
    },
  };
}

export function runWithToolExecutionContext<T>(
  ctx: ToolExecutionContext,
  fn: () => Promise<T>
): Promise<T> {
  return toolContextStorage.run(ctx, fn);
}

const PAGE_SIZE = 1000;

/**
 * Maps any CEFR or difficulty string to Vocabee's DB-enforced constraint ('easy' | 'medium' | 'hard').
 */
export function normalizeDbDifficulty(input?: string | null): "easy" | "medium" | "hard" {
  if (!input) return "medium";
  const lower = input.trim().toLowerCase();
  if (lower === "easy" || lower === "a1" || lower === "a2" || lower === "beginner" || lower === "elementary") {
    return "easy";
  }
  if (lower === "hard" || lower === "c1" || lower === "c2" || lower === "advanced" || lower === "mastery") {
    return "hard";
  }
  return "medium";
}

async function queryAllUserActiveSets(userId: string): Promise<VocabSetRow[]> {
  const supabase = await createClient();
  const sets: VocabSetRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const page = (data ?? []) as VocabSetRow[];
    sets.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return sets;
}

/**
 * Fetches ALL active (non-deleted) vocabulary sets owned by the authenticated user using pagination.
 * Reuses per-request cached result when executed inside an AgentToolExecutor context.
 */
export async function fetchAllUserActiveSets(userId: string): Promise<VocabSetRow[]> {
  const store = toolContextStorage.getStore();
  if (store && store.userId === userId) {
    return store.getSets();
  }
  return queryAllUserActiveSets(userId);
}

async function queryAllUserActiveWords(userId: string): Promise<ScopedWordRecord[]> {
  const supabase = await createClient();
  const rows: ScopedWordRecord[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("vocabularies")
      .select(
        `
        *,
        vocab_sets!inner(id, title, deleted_at),
        review:reviews(*)
      `
      )
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .is("vocab_sets.deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const page = (data ?? []) as Array<
      VocabularyRow & {
        vocab_sets?: { id: string; title: string; deleted_at: string | null } | Array<{ id: string; title: string; deleted_at: string | null }> | null;
        review?: ReviewRow | ReviewRow[] | null;
      }
    >;

    for (const item of page) {
      const setObj = Array.isArray(item.vocab_sets) ? item.vocab_sets[0] : item.vocab_sets;
      const reviewObj = Array.isArray(item.review) ? item.review[0] ?? null : item.review ?? null;
      const level = SrsService.getLevelFromReview(reviewObj);
      let masteryGroup: ScopedWordRecord["masteryGroup"] = "new";
      if (reviewObj?.status === "mastered" || level >= 5) {
        masteryGroup = "mastered";
      } else if (level >= 2) {
        masteryGroup = "learned";
      } else if (reviewObj?.status === "learning" || level === 1) {
        masteryGroup = "learning";
      }

      rows.push({
        ...item,
        setTitle: setObj?.title || "Bộ từ",
        review: reviewObj,
        srsLevel: level,
        masteryGroup,
      });
    }

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

/**
 * Fetches ALL active vocabulary rows belonging to active sets owned by the authenticated user.
 * Reuses per-request cached result when executed inside an AgentToolExecutor context.
 */
export async function fetchAllUserActiveWords(userId: string): Promise<ScopedWordRecord[]> {
  const store = toolContextStorage.getStore();
  if (store && store.userId === userId) {
    return store.getWords();
  }
  return queryAllUserActiveWords(userId);
}

/**
 * Computes exact unique word count (case/whitespace-normalized) alongside total record count.
 */
export function countUniqueWords(words: Array<{ word: string }>): number {
  const unique = new Set<string>();
  for (const item of words) {
    const norm = normalizeVocabularyWord(item.word || "");
    if (norm) unique.add(norm);
  }
  return unique.size;
}

/**
 * Resolves a single vocabulary set owned by `userId` either by `setId` or by case-insensitive `title`.
 */
export async function resolveOwnedSet(
  userId: string,
  opts: { setId?: string; setTitle?: string },
  ctx?: ToolExecutionContext
): Promise<{ set: VocabSetRow | null; ambiguousMatches?: VocabSetRow[] }> {
  const sets = ctx ? await ctx.getSets() : await fetchAllUserActiveSets(userId);

  if (opts.setId) {
    const targetId = opts.setId.trim();
    const exact = sets.find((s) => s.id === targetId);
    return { set: exact ?? null };
  }

  if (opts.setTitle) {
    const query = opts.setTitle.trim().toLowerCase();
    const exact = sets.filter((s) => s.title.trim().toLowerCase() === query);
    if (exact.length === 1) return { set: exact[0] };
    if (exact.length > 1) return { set: null, ambiguousMatches: exact };

    const partial = sets.filter((s) => s.title.toLowerCase().includes(query));
    if (partial.length === 1) return { set: partial[0] };
    if (partial.length > 1) return { set: null, ambiguousMatches: partial };
  }

  return { set: null };
}

export function serializeWordCompact(w: ScopedWordRecord) {
  return {
    id: w.id,
    setId: w.set_id,
    setTitle: w.setTitle,
    word: w.word,
    ipa: w.ipa,
    partOfSpeech: w.part_of_speech,
    meaning: w.meaning,
    example: w.example,
    exampleTranslation: w.example_translation,
    synonyms: w.synonyms ?? [],
    antonyms: w.antonyms ?? [],
    note: w.note,
    difficulty: w.difficulty,
    isStarred: Boolean(w.is_starred),
    srsLevel: `lv${w.srsLevel}`,
    masteryGroup: w.masteryGroup,
    nextReview: w.review?.next_review ?? null,
    lastReview: w.review?.last_review ?? null,
    lastGrade: w.review?.last_grade ?? null,
  };
}
