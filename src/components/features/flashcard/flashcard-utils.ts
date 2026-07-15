import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";

export type FlashcardRow = Database["public"]["Tables"]["vocabularies"]["Row"] & {
  review?: Database["public"]["Tables"]["reviews"]["Row"] | null;
};

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  preposition: "preposition",
  conjunction: "conjunction",
  pronoun: "pronoun",
  interjection: "interjection",
};

const LEVEL_STYLES: Record<number, string> = {
  0: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  1: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  2: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  3: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  4: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  5: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function getPartOfSpeechLabel(value: string | null | undefined) {
  if (!value) return null;
  return PART_OF_SPEECH_LABELS[value.toLowerCase()] ?? value;
}

export function getFlashcardLevel(row: FlashcardRow) {
  if (row.review) return SrsService.getLevelFromReview(row.review);
  const parsed = Number.parseInt(String(row.difficulty ?? ""), 10);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 5) return parsed;
  return 0;
}

export function getLevelBadgeClass(level: number) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES[0];
}

export function getTopicLabel(row: FlashcardRow) {
  const topic = row.note?.trim() || row.source?.trim() || null;
  return topic && topic.length > 0 ? topic : null;
}
