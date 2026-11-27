"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  RotateCw,
  Shuffle,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { HighlightedExample } from "@/components/common/HighlightedExample";
import { useSpeak } from "@/hooks/use-speak";
import { cn } from "@/lib/utils";
import type {
  FlashcardAssessmentStatus,
  PersonalTestFlashcardItem,
} from "@/types/vocabee-test";
import {
  type FlashcardDeckFilter,
  getFlashcardAssessmentSummary,
} from "@/lib/personal-test/flashcard-session";

interface PersonalTestFlashcardsProps {
  cards: PersonalTestFlashcardItem[];
  setLabel?: string;
  currentIndex: number;
  flipped: boolean;
  filter: FlashcardDeckFilter;
  showCompletion: boolean;
  shuffledIds: string[] | null;
  assessments: Record<string, FlashcardAssessmentStatus>;
  reviewedIds: string[];
  hasStartedExercises: boolean;
  onIndexChange: (nextIndex: number) => void;
  onFlippedChange: (nextFlipped: boolean) => void;
  onFilterChange: (nextFilter: FlashcardDeckFilter) => void;
  onShowCompletionChange: (show: boolean) => void;
  onToggleShuffle: () => void;
  onAssess: (cardId: string, status: FlashcardAssessmentStatus | null) => void;
  onRestart: () => void;
  onStartTest: () => void;
}

const AUTO_SPEAK_STORAGE_KEY = "ivocab_flashcard_auto_speak";

export function PersonalTestFlashcards({
  cards,
  setLabel,
  currentIndex,
  flipped,
  filter,
  showCompletion,
  shuffledIds,
  assessments,
  reviewedIds,
  hasStartedExercises,
  onIndexChange,
  onFlippedChange,
  onFilterChange,
  onShowCompletionChange,
  onToggleShuffle,
  onAssess,
  onRestart,
  onStartTest,
}: PersonalTestFlashcardsProps) {
  const { speakText } = useSpeak();
  const [autoSpeak, setAutoSpeak] = useState(false);
  const isFlipAnimatingRef = useRef(false);
  const flipUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(AUTO_SPEAK_STORAGE_KEY) === "true") {
          setAutoSpeak(true);
        }
      } catch {
        // Ignore storage errors
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleAutoSpeak = (next: boolean) => {
    setAutoSpeak(next);
    try {
      window.localStorage.setItem(AUTO_SPEAK_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  };

  const reviewedIdSet = useMemo(() => new Set(reviewedIds), [reviewedIds]);

  const summary = useMemo(
    () => getFlashcardAssessmentSummary(cards, assessments, reviewedIdSet),
    [cards, assessments, reviewedIdSet]
  );

  const orderedCards = useMemo(() => {
    if (!shuffledIds || shuffledIds.length === 0) return cards;
    const byId = new Map(cards.map((c) => [c.id, c]));
    const ordered = shuffledIds
      .map((id) => byId.get(id))
      .filter((c): c is PersonalTestFlashcardItem => Boolean(c));
    const remaining = cards.filter((c) => !shuffledIds.includes(c.id));
    return [...ordered, ...remaining];
  }, [cards, shuffledIds]);

  const activeDeck = useMemo(() => {
    if (filter === "not_remembered") {
      return orderedCards.filter((c) => assessments[c.id] === "not_remembered");
    }
    return orderedCards;
  }, [orderedCards, filter, assessments]);

  const safeIndex =
    activeDeck.length > 0 ? Math.min(Math.max(0, currentIndex), activeDeck.length - 1) : 0;
  const currentCard = activeDeck[safeIndex] ?? null;
  const currentAssessment = currentCard ? assessments[currentCard.id] : undefined;

  const progressPct =
    activeDeck.length > 0 ? Math.round(((safeIndex + 1) / activeDeck.length) * 100) : 0;

  useEffect(() => {
    return () => {
      if (flipUnlockTimerRef.current) {
        clearTimeout(flipUnlockTimerRef.current);
      }
    };
  }, []);

  const currentCardId = currentCard?.id;
  const currentCardWord = currentCard?.word;
  const currentCardAudioUrl = currentCard?.audioUrl;

  useEffect(() => {
    if (!autoSpeak || !currentCardId || !currentCardWord || showCompletion) return;
    const handle = window.setTimeout(() => {
      speakText(currentCardWord, {
        audioUrl: currentCardAudioUrl ?? undefined,
      });
    }, 150);
    return () => window.clearTimeout(handle);
  }, [autoSpeak, currentCardId, currentCardWord, currentCardAudioUrl, showCompletion, speakText]);

  const triggerSafeFlip = () => {
    if (!currentCard || showCompletion) return;
    if (isFlipAnimatingRef.current) return;

    const selection = typeof window !== "undefined" ? window.getSelection() : null;
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    isFlipAnimatingRef.current = true;
    if (flipUnlockTimerRef.current) clearTimeout(flipUnlockTimerRef.current);
    flipUnlockTimerRef.current = setTimeout(() => {
      isFlipAnimatingRef.current = false;
    }, 320);

    onFlippedChange(!flipped);
  };

  const handlePrevCard = () => {
    if (safeIndex <= 0) return;
    onFlippedChange(false);
    onIndexChange(safeIndex - 1);
  };

  const handleNextCard = () => {
    if (activeDeck.length === 0) return;
    if (safeIndex >= activeDeck.length - 1) {
      onShowCompletionChange(true);
      return;
    }
    onFlippedChange(false);
    onIndexChange(safeIndex + 1);
  };

  // Keyboard shortcuts: Space (flip), ArrowLeft / ArrowRight (navigate)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (showCompletion) return;

      if (event.code === "Space") {
        event.preventDefault();
        triggerSafeFlip();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevCard();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNextCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border/80 bg-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Chưa có thẻ từ vựng cho bài kiểm tra này
          </h3>
          <p className="text-xs text-muted-foreground">
            Bạn có thể chuyển thẳng sang phần bài tập kiểm tra.
          </p>
        </div>
        <Button type="button" onClick={onStartTest} className="gap-2 cursor-pointer font-semibold">
          <span>Bắt đầu kiểm tra</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Completion View
  if (showCompletion) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-3xl border border-primary/25 bg-card p-6 sm:p-8 text-center shadow-sm space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <Badge className="bg-primary/10 text-primary border-primary/25 text-xs font-semibold">
              Hoàn thành ôn tập Flashcards
            </Badge>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Bạn đã sẵn sàng cho bài kiểm tra!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Đánh giá tạm thời chỉ dùng cho phiên ôn tập này và không làm thay đổi dữ liệu SRS dài hạn của bạn.
            </p>
          </div>

          {/* Summary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Đã xem
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {summary.reviewedCount}
                <span className="text-xs font-normal text-muted-foreground">
                  /{summary.totalCount}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Đã nhớ
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {summary.rememberedCount}
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Chưa nhớ
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {summary.notRememberedCount}
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Chưa đánh giá
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-muted-foreground">
                {summary.unassessedCount}
              </p>
            </div>
          </div>

          {/* Primary Transition + Secondary Review Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {summary.notRememberedCount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onFilterChange("not_remembered");
                  onIndexChange(0);
                  onFlippedChange(false);
                  onShowCompletionChange(false);
                }}
                className="w-full sm:w-auto gap-1.5 cursor-pointer border-amber-500/35 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Ôn lại {summary.notRememberedCount} từ chưa nhớ</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onRestart}
              className="w-full sm:w-auto gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Xem lại từ đầu</span>
            </Button>

            <Button
              type="button"
              onClick={onStartTest}
              className="w-full sm:w-auto gap-2 cursor-pointer font-bold px-6 shadow-sm"
            >
              <span>{hasStartedExercises ? "Quay lại bài kiểm tra" : "Bắt đầu kiểm tra"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderAudioControls = (word: string, audioUrl?: string | null) => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          speakText(word, { audioUrl: audioUrl ?? undefined });
        }}
        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs cursor-pointer"
        aria-label={`Phát âm ${word}`}
      >
        <Volume2 className="h-3.5 w-3.5 text-primary" />
        <span>Phát âm</span>
      </Button>
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
        title="Tự động phát âm khi chuyển thẻ"
      >
        <span className="hidden sm:inline text-[11px] font-medium">Tự phát</span>
        <Switch
          checked={autoSpeak}
          onCheckedChange={handleToggleAutoSpeak}
          ariaLabel="Tự động phát âm"
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Stage Intro + Top Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>
                {setLabel ? `${setLabel} • Flashcards` : "Giai đoạn 1: Ôn tập Flashcards"}
              </span>
            </Badge>
            <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
              {activeDeck.length > 0 ? `${safeIndex + 1} / ${activeDeck.length} từ` : `0 / ${cards.length} từ`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ôn lại các từ vựng trong set này trước khi làm 4 dạng bài kiểm tra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={shuffledIds ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleShuffle}
            className={cn(
              "h-8 gap-1.5 text-xs cursor-pointer",
              shuffledIds && "border-primary/30 bg-primary/10 text-primary"
            )}
            title="Xáo trộn thứ tự thẻ"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Xáo trộn</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRestart}
            className="h-8 gap-1.5 text-xs cursor-pointer"
            title="Bắt đầu lại từ thẻ đầu tiên"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Học lại</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onStartTest}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <span>{hasStartedExercises ? "Tiếp tục kiểm tra" : "Bắt đầu kiểm tra"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Pills & Session Self-Assessment Counters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onFilterChange("all");
              onIndexChange(0);
              onFlippedChange(false);
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả ({cards.length})
          </button>

          <button
            type="button"
            disabled={summary.notRememberedCount === 0}
            onClick={() => {
              onFilterChange("not_remembered");
              onIndexChange(0);
              onFlippedChange(false);
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              filter === "not_remembered"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Chưa nhớ ({summary.notRememberedCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã nhớ: {summary.rememberedCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 font-medium text-amber-700 dark:text-amber-400 tabular-nums">
            <AlertCircle className="h-3.5 w-3.5" />
            Chưa nhớ: {summary.notRememberedCount}
          </span>
          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 font-medium text-muted-foreground tabular-nums">
            Chưa đánh giá: {summary.unassessedCount}
          </span>
        </div>
      </div>

      {/* Deck Progress */}
      <Progress value={progressPct} className="h-1.5 bg-muted" />

      {/* Empty Filter State */}
      {!currentCard ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-foreground">
            Không còn từ nào đang đánh dấu &ldquo;Chưa nhớ&rdquo;.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onFilterChange("all");
                onIndexChange(0);
                onFlippedChange(false);
              }}
              className="cursor-pointer text-xs"
            >
              Xem tất cả thẻ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onStartTest}
              className="cursor-pointer gap-1.5 text-xs font-semibold"
            >
              <span>Bắt đầu kiểm tra</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 3D Flip Flashcard */}
          <div
            className="relative rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              role="button"
              tabIndex={0}
              aria-label={`Thẻ từ vựng ${currentCard.word}. Nhấn để lật thẻ.`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  triggerSafeFlip();
                }
              }}
              onClick={triggerSafeFlip}
              onAnimationComplete={() => {
                isFlipAnimatingRef.current = false;
              }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 23, mass: 0.9 }}
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
              className="relative min-h-[300px] sm:min-h-[360px] w-full cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* FRONT FACE */}
              <section
                className="flex min-h-[300px] sm:min-h-[360px] w-full flex-col justify-between rounded-2xl bg-card p-5 sm:p-7"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    Mặt trước • Từ vựng
                  </Badge>

                  <div className="flex items-center gap-2">
                    {currentAssessment === "remembered" && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã nhớ
                      </Badge>
                    )}
                    {currentAssessment === "not_remembered" && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Chưa nhớ
                      </Badge>
                    )}
                    {renderAudioControls(currentCard.word, currentCard.audioUrl)}
                  </div>
                </div>

                <div
                  className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-3.5 py-6 text-center select-text cursor-text"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground break-words max-w-full">
                    {currentCard.word}
                  </h2>

                  {(currentCard.partOfSpeech || currentCard.ipa) && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {currentCard.partOfSpeech && (
                        <Badge variant="outline" className="capitalize text-xs px-2.5 py-0.5">
                          {currentCard.partOfSpeech}
                        </Badge>
                      )}
                      {currentCard.ipa && (
                        <span className="font-mono text-sm sm:text-base text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md border border-border/60">
                          {currentCard.ipa}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-primary/80" />
                    <span>Nhấn vào thẻ hoặc bấm Space để lật xem nghĩa</span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums">
                    {safeIndex + 1}/{activeDeck.length}
                  </span>
                </div>
              </section>

              {/* BACK FACE */}
              <section
                className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl bg-card p-5 sm:p-7 overflow-y-auto"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(0)",
                }}
              >
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    Mặt sau • Nghĩa & Ngữ cảnh
                  </Badge>

                  {renderAudioControls(currentCard.word, currentCard.audioUrl)}
                </div>

                <div
                  className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 py-4 text-center select-text cursor-text"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      {currentCard.word}
                      {currentCard.ipa ? ` • ${currentCard.ipa}` : ""}
                      {currentCard.partOfSpeech ? ` • ${currentCard.partOfSpeech}` : ""}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold leading-snug text-foreground break-words">
                      {currentCard.meaning || "Chưa có nghĩa tiếng Việt"}
                    </h3>
                  </div>

                  {(currentCard.example || currentCard.exampleTranslation) && (
                    <div className="w-full max-w-xl text-left">
                      <HighlightedExample
                        word={currentCard.word}
                        meaning={currentCard.meaning}
                        example={currentCard.example}
                        exampleTranslation={currentCard.exampleTranslation}
                        showLabels
                      />
                    </div>
                  )}

                  {currentCard.synonyms.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground mr-1">
                        Đồng nghĩa:
                      </span>
                      {currentCard.synonyms.map((syn) => (
                        <Badge key={syn} variant="secondary" className="text-xs font-normal">
                          {syn}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground shrink-0">
                  <div className="inline-flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-primary/80" />
                    <span>Nhấn vào thẻ để quay lại mặt trước</span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums">
                    {safeIndex + 1}/{activeDeck.length}
                  </span>
                </div>
              </section>
            </motion.div>
          </div>

          {/* Self-Assessment & Navigation Controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            {/* Previous Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevCard}
              disabled={safeIndex === 0}
              className="h-9 gap-1.5 text-xs cursor-pointer order-2 sm:order-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Thẻ trước</span>
            </Button>

            {/* Temporary Self-Assessment */}
            <div className="flex flex-wrap items-center justify-center gap-2 order-1 sm:order-2">
              {flipped || currentAssessment ? (
                <>
                  <Button
                    type="button"
                    variant={currentAssessment === "not_remembered" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      onAssess(
                        currentCard.id,
                        currentAssessment === "not_remembered" ? null : "not_remembered"
                      )
                    }
                    className={cn(
                      "h-9 gap-1.5 text-xs font-semibold cursor-pointer",
                      currentAssessment === "not_remembered"
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                        : "border-amber-500/35 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                    )}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Chưa nhớ</span>
                  </Button>

                  <Button
                    type="button"
                    variant={currentAssessment === "remembered" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      onAssess(
                        currentCard.id,
                        currentAssessment === "remembered" ? null : "remembered"
                      )
                    }
                    className={cn(
                      "h-9 gap-1.5 text-xs font-semibold cursor-pointer",
                      currentAssessment === "remembered"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        : "border-emerald-500/35 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã nhớ</span>
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Lật thẻ để đánh giá &ldquo;Đã nhớ&rdquo; hoặc &ldquo;Chưa nhớ&rdquo;
                </span>
              )}
            </div>

            {/* Next / Complete Flashcards Button */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleNextCard}
              className="h-9 gap-1.5 text-xs font-semibold cursor-pointer order-3"
            >
              <span>
                {safeIndex >= activeDeck.length - 1 ? "Hoàn thành thẻ cuối" : "Thẻ tiếp"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
