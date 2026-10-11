"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Settings2,
  Shuffle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SrsLevel, SrsService } from "@/lib/srs/srs-service";
import { FlashcardDeck } from "./FlashcardDeck";
import {
  FlashcardFilterMode,
  FlashcardSettingsDialog,
  FlashcardSettingsState,
} from "./FlashcardSettingsDialog";
import { FlashcardRow } from "./flashcard-utils";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";
import { notifyStudyActivityUpdated } from "@/lib/events/study-events";
import { cn } from "@/lib/utils";

interface FlashcardStudyProps {
  initialWords: FlashcardRow[];
  setInfo: { id: string; title: string };
  onBackHref: string;
  readOnly?: boolean;
}

interface FlashcardProgressState {
  level: SrsLevel;
  progress: number;
  nextReviewAt: string | null;
  intervalDays: number | null;
}

const DEFAULT_SETTINGS: FlashcardSettingsState = {
  autoSpeak: false,
  frontMode: "term",
  filterMode: "all",
};

const AUTO_SPEAK_STORAGE_KEY = "ivocab_flashcard_auto_speak";

function loadDefaultSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    autoSpeak: window.localStorage.getItem(AUTO_SPEAK_STORAGE_KEY) === "true",
  };
}

function saveAutoSpeakPreference(autoSpeak: boolean) {
  window.localStorage.setItem(AUTO_SPEAK_STORAGE_KEY, String(autoSpeak));
}

function isUnlearnedWord(word: FlashcardRow) {
  if (!word.review?.status) return true;
  const level = SrsService.getLevelFromReview(word.review);
  return word.review.status === "new" || word.review.status === "learning" || level < 5;
}

function applyFilter(
  words: FlashcardRow[],
  filterMode: FlashcardFilterMode,
  starredIds: Set<string>
) {
  if (filterMode === "starred") {
    return words.filter((word) => starredIds.has(word.id));
  }

  if (filterMode === "unlearned") {
    return words.filter((word) => isUnlearnedWord(word));
  }

  return words;
}

function shuffleIds(words: FlashcardRow[]) {
  const next = words.map((word) => word.id);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function FlashcardStudy({
  initialWords,
  setInfo,
  onBackHref,
  readOnly = false,
}: FlashcardStudyProps) {
  const router = useRouter();
  const [settings, setSettings] = React.useState<FlashcardSettingsState>(loadDefaultSettings);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [transitionDirection, setTransitionDirection] = React.useState<1 | -1>(1);
  const [shuffleEnabled, setShuffleEnabled] = React.useState(false);
  const [progressModeEnabled, setProgressModeEnabled] = React.useState(false);
  const [shuffledOrderIds, setShuffledOrderIds] = React.useState<string[]>(() =>
    initialWords.map((word) => word.id)
  );
  const [progressStateMap, setProgressStateMap] = React.useState<
    Record<string, FlashcardProgressState>
  >(() =>
    Object.fromEntries(
      initialWords.map((word) => [
        word.id,
        {
          level: SrsService.getLevelFromReview(word.review),
          progress: word.review?.repetitions ?? 0,
          nextReviewAt: word.review?.next_review ?? null,
          intervalDays: word.review?.interval ?? null,
        },
      ])
    )
  );
  const [starredMap, setStarredMap] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialWords.map((word) => [word.id, Boolean(word.is_starred)]))
  );

  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const starredIds = React.useMemo(
    () =>
      new Set(
        Object.entries(starredMap)
          .filter(([, starred]) => starred)
          .map(([id]) => id)
      ),
    [starredMap]
  );

  const filteredDeck = React.useMemo(
    () => applyFilter(initialWords, settings.filterMode, starredIds),
    [initialWords, settings.filterMode, starredIds]
  );

  const deck = React.useMemo(() => {
    if (!shuffleEnabled) return filteredDeck;
    const byId = new Map(filteredDeck.map((word) => [word.id, word]));
    const ordered = shuffledOrderIds
      .map((id) => byId.get(id))
      .filter((word): word is FlashcardRow => Boolean(word));
    const remaining = filteredDeck.filter((word) => !shuffledOrderIds.includes(word.id));
    return [...ordered, ...remaining];
  }, [filteredDeck, shuffleEnabled, shuffledOrderIds]);

  const safeCurrentIndex = deck.length > 0 ? Math.min(currentIndex, deck.length - 1) : 0;
  const currentWord = deck[safeCurrentIndex] ?? null;
  const progress = deck.length > 0 ? Math.round(((safeCurrentIndex + 1) / deck.length) * 100) : 0;
  usePreserveScrollPosition(
    currentWord?.id ?? (deck.length === 0 ? "empty" : `${safeCurrentIndex}`)
  );

  const persistSettings = React.useCallback((next: FlashcardSettingsState) => {
    setSettings(next);
  }, []);

  React.useEffect(() => {
    saveAutoSpeakPreference(settings.autoSpeak);
  }, [settings.autoSpeak]);

  const handlePrevious = React.useCallback(() => {
    setTransitionDirection(-1);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setFlipped(false);
  }, []);

  const handleNext = React.useCallback(() => {
    setTransitionDirection(1);
    setCurrentIndex((prev) => Math.min(deck.length - 1, prev + 1));
    setFlipped(false);
  }, [deck.length]);

  const handleToggleShuffle = React.useCallback(() => {
    setShuffleEnabled((prev) => {
      const next = !prev;
      if (next) {
        setShuffledOrderIds(shuffleIds(filteredDeck));
        setCurrentIndex(0);
        setFlipped(false);
      }
      return next;
    });
  }, [filteredDeck]);

  const handleAdvanceProgress = React.useCallback(
    async (delta: number) => {
      if (!currentWord || readOnly) return;

      const answerResult = delta > 0 ? "correct" : "wrong";
      const currentState = progressStateMap[currentWord.id] ?? {
        level: SrsService.getLevelFromReview(currentWord.review),
        progress: currentWord.review?.repetitions ?? 0,
        nextReviewAt: currentWord.review?.next_review ?? null,
        intervalDays: currentWord.review?.interval ?? null,
      };
      const result = SrsService.processLearningResult({
        mode: "flashcard",
        answerResult,
        currentState,
      });

      if (result.shouldPersist) {
        setProgressStateMap((prev) => ({ ...prev, [currentWord.id]: result.state }));
      }
      setTransitionDirection(1);
      setCurrentIndex((prev) => Math.min(deck.length - 1, prev + 1));
      setFlipped(false);

      if (!result.shouldPersist) return;

      try {
        const response = await fetch("/api/srs/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabularyId: currentWord.id,
            mode: "flashcard",
            answerResult,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to save flashcard progress");
        }
        notifyStudyActivityUpdated();
      } catch (error: unknown) {
        console.error("Flashcard progress update error:", error);
        toast.error("Không thể cập nhật tiến độ thẻ từ");
      }
    },
    [currentWord, deck.length, progressStateMap, readOnly]
  );

  const handleSpeak = React.useCallback(() => {
    if (!currentWord || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  React.useEffect(() => {
    if (!settings.autoSpeak || !currentWord) return;
    const handle = window.setTimeout(() => {
      handleSpeak();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [currentWord, handleSpeak, settings.autoSpeak]);

  const handleFlip = React.useCallback(() => setFlipped((prev) => !prev), []);

  const toggleStar = React.useCallback(() => {
    if (readOnly || !currentWord) return;

    const nextStarred = !starredMap[currentWord.id];
    setStarredMap((prev) => ({ ...prev, [currentWord.id]: nextStarred }));

    fetch("/api/vocabulary/star", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vocabularyId: currentWord.id,
        isStarred: nextStarred,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save star status");
        }
        toast.success(
          nextStarred
            ? `Đã đánh dấu sao "${currentWord.word}"`
            : `Đã bỏ đánh dấu sao "${currentWord.word}"`
        );
      })
      .catch((error: unknown) => {
        console.error("Star update error:", error);
        setStarredMap((prev) => ({ ...prev, [currentWord.id]: !nextStarred }));
        toast.error("Không thể cập nhật trạng thái đánh dấu sao");
      });
  }, [currentWord, readOnly, starredMap]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.code === "Space") {
        event.preventDefault();
        handleFlip();
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.code === "Escape") {
        event.preventDefault();
        router.push(onBackHref);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrevious, onBackHref, router]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    if (progressModeEnabled) {
      if (dx > 0) void handleAdvanceProgress(1);
      else void handleAdvanceProgress(-1);
      return;
    }

    if (dx > 0) handlePrevious();
    else handleNext();
  };

  if (deck.length === 0) {
    const emptyMessage =
      settings.filterMode === "starred"
        ? "Không có từ vựng nào được đánh dấu sao trong bộ từ này."
        : settings.filterMode === "unlearned"
          ? "Tất cả từ vựng trong bộ từ này đã đạt mức thành thạo."
          : "Chưa có thẻ từ nào trong bộ từ vựng này.";

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => router.push(onBackHref)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
              <p className="text-xs text-muted-foreground">Chế độ thẻ ghi nhớ Flashcard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" />
            <span>Bộ lọc</span>
          </Button>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs space-y-4">
          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground">
            Bạn có thể đổi bộ lọc hiển thị tất cả từ hoặc quay lại bộ từ vựng.
          </p>
          <div className="flex items-center justify-center gap-2">
            {settings.filterMode !== "all" && (
              <Button
                size="sm"
                onClick={() => persistSettings({ ...settings, filterMode: "all" })}
              >
                Hiển thị tất cả từ
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push(onBackHref)}>
              Quay lại
            </Button>
          </div>
        </div>
        <FlashcardSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={(next) => {
            persistSettings(next);
            setCurrentIndex(0);
            setFlipped(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:gap-5 overflow-x-hidden pb-4 sm:pb-10">
      {/* Study Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-border/80 pb-2.5 sm:pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => router.push(onBackHref)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {setInfo.title}
              </h1>
              {readOnly && <Badge variant="secondary">Chỉ xem</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Thẻ từ vựng (Flashcards)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums font-semibold px-2.5 py-1">
            Thẻ {safeCurrentIndex + 1} / {deck.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tùy chỉnh</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tiến độ duyệt thẻ</span>
          <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      {/* Flashcard 3D Stage */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden touch-pan-y"
      >
        <AnimatePresence mode="wait" initial={false}>
          {currentWord ? (
            <motion.div
              key={`${currentWord.id}-${settings.filterMode}-${settings.frontMode}`}
              layout
              initial={{
                opacity: 0,
                x: transitionDirection > 0 ? 24 : -24,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: transitionDirection > 0 ? -16 : 16,
                scale: 0.985,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="will-change-transform"
            >
              <FlashcardDeck
                word={currentWord}
                flipped={flipped}
                frontMode={settings.frontMode}
                onFlip={handleFlip}
                onSpeak={handleSpeak}
                onOpenSettings={() => setSettingsOpen(true)}
                onToggleAutoSpeak={() =>
                  persistSettings({ ...settings, autoSpeak: !settings.autoSpeak })
                }
                onToggleStar={toggleStar}
                autoSpeak={settings.autoSpeak}
                isStarred={Boolean(starredMap[currentWord.id])}
                readOnly={readOnly}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Controls & Keyboard Shortcuts */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
          <div className="flex justify-start">
            {!readOnly && (
              <Button
                type="button"
                variant={progressModeEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setProgressModeEnabled((prev) => !prev)}
                title="Bật chế độ tự đánh giá Đã thuộc / Chưa thuộc"
              >
                <Layers3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chấm tiến độ</span>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5">
            {progressModeEnabled && !readOnly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void handleAdvanceProgress(-1)}
                  className="border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
                  aria-label="Chưa thuộc"
                >
                  <X className="h-4 w-4" />
                  <span>Chưa thuộc</span>
                </Button>

                <div className="hidden sm:flex items-center px-3 text-xs font-semibold tabular-nums text-muted-foreground">
                  {safeCurrentIndex + 1} / {deck.length}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void handleAdvanceProgress(1)}
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
                  aria-label="Đã thuộc"
                >
                  <Check className="h-4 w-4" />
                  <span>Đã thuộc</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={handlePrevious}
                  disabled={safeCurrentIndex === 0}
                  aria-label="Thẻ trước"
                  title="Thẻ trước (←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="min-w-[88px] text-center text-xs sm:text-sm font-semibold tabular-nums text-foreground">
                  {safeCurrentIndex + 1} / {deck.length}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={handleNext}
                  disabled={safeCurrentIndex >= deck.length - 1}
                  aria-label="Thẻ tiếp theo"
                  title="Thẻ tiếp theo (→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant={shuffleEnabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggleShuffle}
              title="Trộn ngẫu nhiên thứ tự thẻ"
              aria-label="Trộn thứ tự thẻ"
            >
              <Shuffle className={cn("h-3.5 w-3.5", shuffleEnabled && "rotate-12")} />
              <span className="hidden sm:inline">Trộn thẻ</span>
            </Button>
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Phím tắt:</span>
          <kbd>←</kbd>
          <kbd>→</kbd>
          <span>chuyển thẻ</span>
          <span>•</span>
          <kbd>Space</kbd>
          <span>lật mặt thẻ</span>
          <span>•</span>
          <kbd>Esc</kbd>
          <span>thoát</span>
        </div>
      </div>

      <FlashcardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(next) => {
          persistSettings(next);
          setCurrentIndex(0);
          setFlipped(false);
        }}
      />
    </div>
  );
}
