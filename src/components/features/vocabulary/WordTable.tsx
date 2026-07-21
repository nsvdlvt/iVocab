"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";
import { cn } from "@/lib/utils";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

type WordWithReview = VocabularyRow & { review?: ReviewRow | null };

interface WordTableProps {
  words: WordWithReview[];
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "danh từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  preposition: "giới từ",
  conjunction: "liên từ",
  pronoun: "đại từ",
  interjection: "thán từ",
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  lv0: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  lv1: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  lv2: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  lv3: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  lv4: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lv5: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

function getStatusText(word: WordWithReview) {
  const review = word.review;
  const level = SrsService.getLevelFromReview(review ?? null);

  if (level >= 5) return "Mastered";
  if (level < 2) return "Learning";
  if (review?.next_review && SrsService.canReviewWord({ level, nextReviewAt: review.next_review })) {
    return "Review Today";
  }
  if (review?.next_review) {
    const diffMs = new Date(review.next_review).getTime() - Date.now();
    const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    return `Review in ${days} days`;
  }
  return "Learning";
}

function getLevelBadgeClass(level: string) {
  return LEVEL_BADGE_STYLES[level] ?? "bg-muted text-muted-foreground border-border";
}

export function WordTable({ words }: WordTableProps) {
  const searchParams = useSearchParams();
  const focusWord = searchParams.get("focusWord");
  const [highlighted, setHighlighted] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!focusWord) return;
    const el = document.getElementById(`word-${focusWord}`);
    if (!el) return;
    setHighlighted(focusWord);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = window.setTimeout(() => setHighlighted(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [focusWord]);

  const getPartOfSpeechLabel = (pos: string | null) => {
    if (!pos) return null;
    return PART_OF_SPEECH_LABELS[pos] ?? pos;
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
            <th className="px-6 py-4">Word</th>
            <th className="px-6 py-4">Level</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">IPA / POS</th>
            <th className="px-6 py-4">Meaning</th>
            <th className="px-6 py-4">Example</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {words.map((w) => {
            const posLabel = getPartOfSpeechLabel(w.part_of_speech);
            const level = `lv${SrsService.getLevelFromReview(w.review ?? null)}`;
            return (
              <tr
                key={w.id}
                id={`word-${w.id}`}
                className={cn(
                  "transition-all duration-200",
                  highlighted === w.id ? "bg-yellow-100/70 ring-1 ring-yellow-300 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]" : "hover:bg-muted/10"
                )}
              >
                <td className="px-6 py-4">
                  <span className="font-bold text-foreground text-base">{w.word}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getLevelBadgeClass(level)}`}>
                    Lv{level.replace("lv", "")}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-foreground/80">{getStatusText(w)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    {w.ipa && <span className="font-mono text-xs text-muted-foreground">{w.ipa}</span>}
                    {posLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                        {posLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-foreground">{w.meaning}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5 max-w-sm">
                    {w.example ? (
                      <span className="text-xs italic text-foreground/90">&ldquo;{w.example}&rdquo;</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Chưa có ví dụ</span>
                    )}
                    {w.example_translation && (
                      <span className="text-[11px] text-muted-foreground">{w.example_translation}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
