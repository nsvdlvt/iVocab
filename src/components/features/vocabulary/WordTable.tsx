"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Volume2, Edit2, Search, X, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FavoriteToggleButton } from "@/components/common/FavoriteToggleButton";
import {
  EditVocabularyDialog,
  type EditableVocabulary,
} from "./EditVocabularyDialog";
import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";
import { cn } from "@/lib/utils";
import { HighlightedSentence } from "@/components/common/HighlightedExample";
import { toggleFavoriteVocabulary } from "@/actions/vocabulary/favorite";
import { toast } from "sonner";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useSpeak } from "@/hooks/use-speak";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

type WordWithReview = VocabularyRow & { review?: ReviewRow | null };

interface WordTableProps {
  words: WordWithReview[];
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  pronoun: "Đại từ",
  interjection: "Thán từ",
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  lv0: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  lv1: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300",
  lv2: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  lv3: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
  lv4: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  lv5: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
};

function getStatusMeta(word: WordWithReview) {
  const review = word.review;
  const level = SrsService.getLevelFromReview(review ?? null);

  if (level >= 5) {
    return {
      label: "Thành thạo",
      tone: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (level === 0 && !review) {
    return {
      label: "Từ mới",
      tone: "text-muted-foreground",
    };
  }
  if (
    review?.next_review &&
    SrsService.canReviewWord({ level, nextReviewAt: review.next_review })
  ) {
    return {
      label: "Cần ôn ngay",
      tone: "text-amber-600 dark:text-amber-400 font-semibold",
    };
  }
  if (review?.next_review) {
    const diffMs = new Date(review.next_review).getTime() - Date.now();
    const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    return {
      label: `Ôn sau ${days} ngày`,
      tone: "text-muted-foreground",
    };
  }
  return {
    label: "Đang học",
    tone: "text-sky-600 dark:text-sky-400",
  };
}

function getLevelBadgeClass(level: string) {
  return (
    LEVEL_BADGE_STYLES[level] ?? "bg-muted text-muted-foreground border-border"
  );
}

export function WordTable({ words }: WordTableProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const focusWord = searchParams.get("focusWord");
  useScrollRestoration(pathname);
  const { speakText } = useSpeak();

  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  const [localWords, setLocalWords] = React.useState(words);
  // Note: localWords is initialized from props; parent should remount with key={} when the list fully changes.
  const [searchQuery, setSearchQuery] = React.useState("");
  const [onlyStarred, setOnlyStarred] = React.useState(false);
  const [editingWord, setEditingWord] =
    React.useState<EditableVocabulary | null>(null);

  React.useEffect(() => {
    if (!focusWord) return;
    const candidates = document.querySelectorAll<HTMLElement>(
      `[data-word-id="${focusWord}"]`
    );
    const visibleEl =
      Array.from(candidates).find((node) => node.offsetParent !== null) ??
      document.getElementById(`word-${focusWord}`);
    if (!visibleEl) return;

    visibleEl.scrollIntoView({ behavior: "smooth", block: "center" });
    const highlightTimeout = window.setTimeout(() => setHighlighted(focusWord), 0);
    const clearTimeout = window.setTimeout(() => setHighlighted(null), 2500);
    return () => {
      window.clearTimeout(highlightTimeout);
      window.clearTimeout(clearTimeout);
    };
  }, [focusWord]);

  const getPartOfSpeechLabel = (pos: string | null) => {
    if (!pos) return null;
    return PART_OF_SPEECH_LABELS[pos.toLowerCase()] ?? pos;
  };

  const handleToggleFavorite = async (w: WordWithReview) => {
    const nextFavorite = !Boolean(w.is_starred);
    setLocalWords((prev) =>
      prev.map((row) =>
        row.id === w.id ? { ...row, is_starred: nextFavorite } : row
      )
    );
    try {
      await toggleFavoriteVocabulary(w.id, nextFavorite);
      toast.success(
        nextFavorite ? "Đã đánh dấu yêu thích" : "Đã bỏ đánh dấu yêu thích"
      );
    } catch (error) {
      console.error("Favorite update error:", error);
      setLocalWords((prev) =>
        prev.map((row) =>
          row.id === w.id ? { ...row, is_starred: !nextFavorite } : row
        )
      );
      toast.error("Không thể cập nhật trạng thái yêu thích");
    }
  };

  const handleOpenEdit = (w: WordWithReview) => {
    setEditingWord({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      ipa: w.ipa,
      part_of_speech: w.part_of_speech,
      example: w.example,
      example_translation: w.example_translation,
      synonyms: w.synonyms,
      note: w.note,
    });
  };

  const filteredWords = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return localWords.filter((w) => {
      if (focusWord && w.id === focusWord) return true;
      if (onlyStarred && !w.is_starred) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        (w.ipa ?? "").toLowerCase().includes(q) ||
        (w.part_of_speech ?? "").toLowerCase().includes(q) ||
        (w.example ?? "").toLowerCase().includes(q) ||
        (w.example_translation ?? "").toLowerCase().includes(q)
      );
    });
  }, [localWords, searchQuery, onlyStarred, focusWord]);

  return (
    <div className="space-y-3">
      {/* Filter / Search toolbar for the word list */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm từ, nghĩa hoặc ví dụ..."
            className="h-9 rounded-lg pl-9 pr-8 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant={onlyStarred ? "secondary" : "outline"}
            size="sm"
            onClick={() => setOnlyStarred((prev) => !prev)}
            className={cn(
              "h-9 gap-1.5 rounded-lg text-xs font-medium",
              onlyStarred &&
                "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            )}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                onlyStarred && "fill-amber-400 text-amber-500"
              )}
            />
            <span>Yêu thích</span>
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Hiển thị{" "}
            <strong className="font-semibold text-foreground">
              {filteredWords.length}
            </strong>{" "}
            / {localWords.length} từ
          </span>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/50 py-12 text-center text-xs text-muted-foreground">
          Không tìm thấy từ vựng phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-11 px-3 py-3 text-center" aria-label="Yêu thích">
                    <Star className="h-3.5 w-3.5 mx-auto text-muted-foreground" aria-hidden="true" />
                  </th>
                  <th className="px-4 py-3">Từ vựng & IPA</th>
                  <th className="px-4 py-3">Từ loại</th>
                  <th className="px-4 py-3">Ý nghĩa & Ví dụ</th>
                  <th className="px-4 py-3">Mức SRS</th>
                  <th className="w-14 px-3 py-3 text-right">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filteredWords.map((w) => {
                  const posLabel = getPartOfSpeechLabel(w.part_of_speech);
                  const levelNum = SrsService.getLevelFromReview(
                    w.review ?? null
                  );
                  const levelKey = `lv${levelNum}`;
                  const statusMeta = getStatusMeta(w);

                  return (
                    <tr
                      key={w.id}
                      id={`word-${w.id}`}
                      data-word-id={w.id}
                      data-scroll-anchor={`word-row-${w.id}`}
                      className={cn(
                        "group transition-colors duration-150",
                        highlighted === w.id
                          ? "bg-amber-500/10 ring-1 ring-inset ring-amber-500/40"
                          : "hover:bg-muted/30"
                      )}
                    >
                      {/* Star Toggle */}
                      <td
                        className="px-3 py-3.5 text-center align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoriteToggleButton
                          isFavorite={Boolean(w.is_starred)}
                          onToggle={() => handleToggleFavorite(w)}
                        />
                      </td>

                      {/* Word + IPA + Audio */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-[15px]">
                                {w.word}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  speakText(w.word, {
                                    audioUrl: w.audio_url ?? undefined,
                                  })
                                }
                                aria-label={`Phát âm ${w.word}`}
                                title={`Phát âm ${w.word}`}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {w.ipa && (
                              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                                {w.ipa}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Part of Speech */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        {posLabel ? (
                          <Badge
                            variant="secondary"
                            className="rounded-md font-medium text-[11px]"
                          >
                            {posLabel}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            —
                          </span>
                        )}
                      </td>

                      {/* Meaning + Example */}
                      <td className="px-4 py-3.5 align-top max-w-md">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground leading-snug">
                            {w.meaning}
                          </p>
                          {w.example && (
                            <p className="text-xs italic text-muted-foreground leading-relaxed">
                              &ldquo;
                              <HighlightedSentence
                                sentence={w.example}
                                type="en"
                                targetWord={w.word}
                              />
                              &rdquo;
                            </p>
                          )}
                          {w.example_translation && (
                            <p className="text-[11px] text-muted-foreground/80">
                              <HighlightedSentence
                                sentence={w.example_translation}
                                type="vi"
                                meaning={w.meaning}
                              />
                            </p>
                          )}
                          {w.synonyms && w.synonyms.length > 0 && (
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                              <span className="font-semibold text-foreground/80">Cụm từ / Đồng nghĩa:</span>{" "}
                              {w.synonyms.join(", ")}
                            </p>
                          )}
                          {w.note && (
                            <p className="text-[11px] text-muted-foreground/85 italic">
                              <span className="font-medium not-italic text-foreground/80">Ghi chú:</span> {w.note}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* SRS Level + Status */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                              getLevelBadgeClass(levelKey)
                            )}
                          >
                            Lv{levelNum}
                          </Badge>
                          <span className={cn("text-[11px]", statusMeta.tone)}>
                            {statusMeta.label}
                          </span>
                        </div>
                      </td>

                      {/* Edit Action */}
                      <td className="px-3 py-3.5 text-right align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(w)}
                          aria-label={`Chỉnh sửa ${w.word}`}
                          title="Chỉnh sửa từ"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< md) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {filteredWords.map((w) => {
              const posLabel = getPartOfSpeechLabel(w.part_of_speech);
              const levelNum = SrsService.getLevelFromReview(w.review ?? null);
              const levelKey = `lv${levelNum}`;
              const statusMeta = getStatusMeta(w);

              return (
                <div
                  key={w.id}
                  data-word-id={w.id}
                  data-scroll-anchor={`word-row-${w.id}`}
                  className={cn(
                    "rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all space-y-2.5",
                    highlighted === w.id &&
                      "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <FavoriteToggleButton
                        isFavorite={Boolean(w.is_starred)}
                        onToggle={() => handleToggleFavorite(w)}
                        className="-ml-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-base text-foreground break-words">
                            {w.word}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              speakText(w.word, {
                                audioUrl: w.audio_url ?? undefined,
                              })
                            }
                            aria-label={`Phát âm ${w.word}`}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          {posLabel && (
                            <Badge
                              variant="secondary"
                              className="rounded-md text-[10px] font-medium"
                            >
                              {posLabel}
                            </Badge>
                          )}
                        </div>
                        {w.ipa && (
                          <span className="block font-mono text-xs text-muted-foreground">
                            {w.ipa}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                          getLevelBadgeClass(levelKey)
                        )}
                      >
                        Lv{levelNum}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenEdit(w)}
                        aria-label={`Chỉnh sửa ${w.word}`}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pl-7 space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {w.meaning}
                    </p>
                    {(w.example || w.example_translation) && (
                      <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
                        {w.example && (
                          <p className="italic text-foreground/90">
                            &ldquo;
                            <HighlightedSentence
                              sentence={w.example}
                              type="en"
                              targetWord={w.word}
                            />
                            &rdquo;
                          </p>
                        )}
                        {w.example_translation && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            <HighlightedSentence
                              sentence={w.example_translation}
                              type="vi"
                              meaning={w.meaning}
                            />
                          </p>
                        )}
                      </div>
                    )}
                    {w.synonyms && w.synonyms.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Cụm từ / Đồng nghĩa:</span>{" "}
                        {w.synonyms.join(", ")}
                      </p>
                    )}
                    {w.note && (
                      <p className="text-xs text-muted-foreground/85 italic">
                        <span className="font-medium not-italic text-foreground/80">Ghi chú:</span> {w.note}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-0.5 text-[11px]">
                      <span className={statusMeta.tone}>{statusMeta.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <EditVocabularyDialog
        open={!!editingWord}
        onOpenChange={(open) => {
          if (!open) setEditingWord(null);
        }}
        item={editingWord}
        onSaved={(updated) => {
          setLocalWords((prev) =>
            prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
          );
          setEditingWord(null);
        }}
      />
    </div>
  );
}
