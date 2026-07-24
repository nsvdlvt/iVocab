"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Layers3, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SrsLevel, SrsService } from "@/lib/srs/srs-service";
import { FlashcardDeck } from "./FlashcardDeck";
import { FlashcardFilterMode, FlashcardSettingsDialog, FlashcardSettingsState } from "./FlashcardSettingsDialog";
import { FlashcardRow } from "./flashcard-utils";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";

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

function applyFilter(words: FlashcardRow[], filterMode: FlashcardFilterMode, starredIds: Set<string>) {
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

export function FlashcardStudy({ initialWords, setInfo, onBackHref, readOnly = false }: FlashcardStudyProps) {
  const router = useRouter();
  const [settings, setSettings] = React.useState<FlashcardSettingsState>(loadDefaultSettings);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [transitionDirection, setTransitionDirection] = React.useState<1 | -1>(1);
  const [shuffleEnabled, setShuffleEnabled] = React.useState(false);
  const [progressModeEnabled, setProgressModeEnabled] = React.useState(false);
  const [shuffledOrderIds, setShuffledOrderIds] = React.useState<string[]>(() => initialWords.map((word) => word.id));
  const [progressStateMap, setProgressStateMap] = React.useState<Record<string, FlashcardProgressState>>(() =>
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
    () => new Set(Object.entries(starredMap).filter(([, starred]) => starred).map(([id]) => id)),
    [starredMap]
  );

  const filteredDeck = React.useMemo(
    () => applyFilter(initialWords, settings.filterMode, starredIds),
    [initialWords, settings.filterMode, starredIds]
  );


  const deck = React.useMemo(() => {
    if (!shuffleEnabled) return filteredDeck;
    const byId = new Map(filteredDeck.map((word) => [word.id, word]));
    const ordered = shuffledOrderIds.map((id) => byId.get(id)).filter((word): word is FlashcardRow => Boolean(word));
    const remaining = filteredDeck.filter((word) => !shuffledOrderIds.includes(word.id));
    return [...ordered, ...remaining];
  }, [filteredDeck, shuffleEnabled, shuffledOrderIds]);
  const safeCurrentIndex = deck.length > 0 ? Math.min(currentIndex, deck.length - 1) : 0;
  const currentWord = deck[safeCurrentIndex] ?? null;
  const progress = deck.length > 0 ? Math.round(((safeCurrentIndex + 1) / deck.length) * 100) : 0;
  usePreserveScrollPosition(currentWord?.id ?? (deck.length === 0 ? "empty" : `${safeCurrentIndex}`));

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

      if (!result.shouldPersist) return;

      setProgressStateMap((prev) => ({ ...prev, [currentWord.id]: result.state }));
      setTransitionDirection(1);
      setCurrentIndex((prev) => Math.min(deck.length - 1, prev + 1));
      setFlipped(false);

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
      } catch (error: unknown) {
        console.error("Flashcard progress update error:", error);
        toast.error("Could not update progress status");
      }
    },
    [currentWord, deck.length, progressStateMap, readOnly]
  );

  const handleSpeak = React.useCallback(() => {
    if (!currentWord || !window.speechSynthesis) return;
    const text = settings.frontMode === "definition" ? currentWord.word : currentWord.word;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [currentWord, settings.frontMode]);

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
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to save star status");
      }
      toast.success(nextStarred ? `Starred "${currentWord.word}"` : `Removed star from "${currentWord.word}"`);
    }).catch((error: unknown) => {
      console.error("Star update error:", error);
      setStarredMap((prev) => ({ ...prev, [currentWord.id]: !nextStarred }));
      toast.error("Could not update star status");
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
      if (dx > 0) handleAdvanceProgress(1);
      else handleAdvanceProgress(-1);
      return;
    }

    if (dx > 0) handlePrevious();
    else handleNext();
  };

  if (deck.length === 0) {
    const emptyMessage =
      settings.filterMode === "starred"
        ? "No starred vocabulary found in this set."
        : settings.filterMode === "unlearned"
          ? "No unlearned vocabulary found in this set."
          : "No cards available in this set.";

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="rounded-xl">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Adjust the filter in settings or add more vocabulary to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden pb-10">
      <div className="flex flex-col gap-4 pb-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="mt-0.5 rounded-xl">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{setInfo.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Minimal flashcards focused on vocabulary study</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 self-end lg:self-auto">
          {readOnly ? (
            <div className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Read only
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[62rem] space-y-3 px-1">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Progress</span>
          <span>
            {safeCurrentIndex + 1} / {deck.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden touch-pan-y pt-1"
      >
        <AnimatePresence mode="wait" initial={false}>
          {currentWord ? (
            <motion.div
              key={`${currentWord.id}-${settings.filterMode}-${settings.frontMode}`}
              layout
              initial={{
                opacity: 0,
                x: transitionDirection > 0 ? 28 : -28,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: transitionDirection > 0 ? -18 : 18,
                scale: 0.97,
              }}
              transition={{
                duration: 0.26,
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
                onToggleAutoSpeak={() => persistSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
                onToggleStar={toggleStar}
                autoSpeak={settings.autoSpeak}
                isStarred={Boolean(starredMap[currentWord.id])}
                readOnly={readOnly}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-3 px-1 pt-2">
        <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
          <span className="font-medium">Phím tắt:</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">←</kbd>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">→</kbd>
          <span>để chuyển thẻ</span>
          <span>•</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">Space</kbd>
          <span>để lật thẻ</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex justify-start">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProgressModeEnabled((prev) => !prev)}
              title="Ngẫu nhiên"
              className={[
                "group relative inline-flex h-12 items-center justify-center gap-2 rounded-full border px-4 shadow-sm transition-all duration-200",
                progressModeEnabled
                  ? "border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
              aria-label="Toggle progress mode"
            >
              <Layers3 className={["h-4 w-4 transition-transform", progressModeEnabled ? "text-white" : "text-slate-500"].join(" ")} />
              <span className="text-sm font-medium">Tiến độ</span>
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                Ngẫu nhiên
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3">
            {progressModeEnabled ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleAdvanceProgress(-1)}
                  className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 shadow-sm transition-all duration-200 hover:bg-rose-100"
                  aria-label="Chưa thuộc"
                >
                  <X className="h-4 w-4" />
                  <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    Chưa thuộc
                  </span>
                </Button>

                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  Thẻ {safeCurrentIndex + 1} / {deck.length}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleAdvanceProgress(1)}
                  className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-100"
                  aria-label="Đã thuộc"
                >
                  <Check className="h-4 w-4" />
                  <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    Đã thuộc
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={safeCurrentIndex === 0}
                  className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
                  aria-label="Previous card"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    Previous
                  </span>
                </Button>

                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  Thẻ {safeCurrentIndex + 1} / {deck.length}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleNext}
                  disabled={safeCurrentIndex >= deck.length - 1}
                  className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
                  aria-label="Next card"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    Next
                  </span>
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleToggleShuffle}
              title="Đánh dấu tiến độ học"
              className={[
                "group relative inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
                shuffleEnabled
                  ? "border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
              aria-label="Shuffle cards"
            >
              <Shuffle className={["h-4 w-4 transition-transform", shuffleEnabled ? "rotate-12 text-white" : "text-slate-500"].join(" ")} />
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                Đánh dấu tiến độ học
              </span>
            </Button>
          </div>
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
