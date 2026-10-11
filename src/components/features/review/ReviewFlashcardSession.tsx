"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Layers3, Settings2, Shuffle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlashcardDeck } from "../flashcard/FlashcardDeck";
import {
  FlashcardSettingsDialog,
  FlashcardSettingsState,
} from "../flashcard/FlashcardSettingsDialog";
import { FlashcardRow } from "../flashcard/flashcard-utils";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";
import { notifyStudyActivityUpdated } from "@/lib/events/study-events";
import {
  advanceFlashcardReviewQueue,
  createFlashcardReviewQueue,
  FlashcardReviewAction,
  FlashcardReviewQueueState,
} from "../flashcard/flashcard-review-queue";
import { cn } from "@/lib/utils";

interface ReviewFlashcardSessionProps {
  words: FlashcardRow[];
  setInfo: { id: string; title: string };
  onBackHref: string;
  reviewSessionId: string;
}

interface ReviewFlashcardShuffleState {
  enabled: boolean;
  orderIds: string[];
}

const SHUFFLE_STORAGE_VERSION = 1;

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

function getShuffleStorageKey(reviewSessionId: string) {
  return `ivocab_review_flashcard_shuffle_v${SHUFFLE_STORAGE_VERSION}_${reviewSessionId}`;
}

function shuffleWords(words: FlashcardRow[]) {
  const next = [...words];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function orderWordsByIds(words: FlashcardRow[], orderIds: string[]) {
  const byId = new Map(words.map((word) => [word.id, word]));
  return orderIds
    .map((id) => byId.get(id))
    .filter((word): word is FlashcardRow => Boolean(word));
}

function loadShuffleState(reviewSessionId: string, words: FlashcardRow[]) {
  if (typeof window === "undefined") {
    return { enabled: false, queue: words };
  }

  try {
    const raw = window.localStorage.getItem(getShuffleStorageKey(reviewSessionId));
    if (!raw) return { enabled: false, queue: words };

    const parsed = JSON.parse(raw) as Partial<ReviewFlashcardShuffleState>;
    const enabled = Boolean(parsed.enabled);
    const queue = parsed.orderIds?.length
      ? orderWordsByIds(words, parsed.orderIds)
      : words;

    return { enabled, queue: queue.length > 0 ? queue : words };
  } catch {
    return { enabled: false, queue: words };
  }
}

export function ReviewFlashcardSession({
  words,
  setInfo,
  onBackHref,
  reviewSessionId,
}: ReviewFlashcardSessionProps) {
  const router = useRouter();
  const initialShuffleState = React.useMemo(
    () => loadShuffleState(reviewSessionId, words),
    [reviewSessionId, words]
  );
  const [queueState, setQueueState] = React.useState<FlashcardReviewQueueState>(() =>
    createFlashcardReviewQueue(initialShuffleState.queue)
  );
  const [shuffleEnabled, setShuffleEnabled] = React.useState<boolean>(
    () => initialShuffleState.enabled
  );
  const [settings, setSettings] = React.useState<FlashcardSettingsState>(
    loadDefaultSettings
  );
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [flipped, setFlipped] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<FlashcardReviewAction | null>(
    null
  );
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const actionTimerRef = React.useRef<number | null>(null);
  const knownIdsRef = React.useRef<Set<string>>(new Set());
  const saveQueueRef = React.useRef<Promise<void>>(Promise.resolve());

  const currentWord = queueState.queue[0] ?? null;
  const totalDue = queueState.knownCount + queueState.queue.length;
  const progress =
    totalDue > 0 ? Math.round((queueState.knownCount / totalDue) * 100) : 0;
  const finished = totalDue > 0 && queueState.queue.length === 0;
  usePreserveScrollPosition(currentWord?.id ?? (finished ? "finished" : "ready"));

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

  const persistSettings = React.useCallback((next: FlashcardSettingsState) => {
    setSettings(next);
  }, []);

  React.useEffect(() => {
    saveAutoSpeakPreference(settings.autoSpeak);
  }, [settings.autoSpeak]);

  React.useEffect(() => {
    return () => {
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    };
  }, []);

  const enqueueSave = React.useCallback(
    (payload: { vocabularyId: string; answerResult: "correct" | "wrong" }) => {
      const nextSave = saveQueueRef.current.then(async () => {
        const response = await fetch("/api/srs/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabularyId: payload.vocabularyId,
            mode: "review",
            answerResult: payload.answerResult,
            reviewSessionId,
          }),
          keepalive: true,
        });

        if (!response.ok) {
          console.error("SRS save failed (review flashcard)", await response.text());
        } else {
          notifyStudyActivityUpdated();
        }
      });

      saveQueueRef.current = nextSave.catch((error) => {
        console.error("SRS save request failed (review flashcard)", error);
      });

      return nextSave;
    },
    [reviewSessionId]
  );

  const flushSaveQueue = React.useCallback(async () => {
    try {
      await saveQueueRef.current;
    } catch {
      // Handled in enqueueSave
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const nextState: ReviewFlashcardShuffleState = {
      enabled: shuffleEnabled,
      orderIds: queueState.queue.map((word) => word.id),
    };
    window.localStorage.setItem(
      getShuffleStorageKey(reviewSessionId),
      JSON.stringify(nextState)
    );
  }, [queueState.queue, reviewSessionId, shuffleEnabled, words]);

  const applyShuffle = React.useCallback(
    (enabled: boolean) => {
      if (actionTimerRef.current) {
        window.clearTimeout(actionTimerRef.current);
        actionTimerRef.current = null;
      }

      setShuffleEnabled(enabled);
      setActiveAction(null);
      setFlipped(false);
      setQueueState(() => {
        const remaining = words.filter((word) => !knownIdsRef.current.has(word.id));
        const nextQueue = enabled ? shuffleWords(remaining) : remaining;

        return {
          queue: nextQueue,
          knownCount: knownIdsRef.current.size,
        };
      });
    },
    [words]
  );

  const submitAction = React.useCallback(
    (action: FlashcardReviewAction) => {
      if (!currentWord || activeAction || finished) return;

      setActiveAction(action);
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);

      actionTimerRef.current = window.setTimeout(() => {
        const isKnown = action === "known";
        const isLastWord = isKnown && queueState.queue.length === 1;

        if (action === "known" && currentWord) {
          knownIdsRef.current.add(currentWord.id);
        }

        setQueueState((prev) => advanceFlashcardReviewQueue(prev, action));
        setFlipped(false);
        setActiveAction(null);

        if (isKnown && currentWord) {
          void enqueueSave({
            vocabularyId: currentWord.id,
            answerResult: "correct",
          }).then(async () => {
            if (!isLastWord) return;
            router.push(`/review/session/${reviewSessionId}/complete`);
          });
        }
      }, 180);
    },
    [
      activeAction,
      currentWord,
      finished,
      queueState.queue.length,
      reviewSessionId,
      router,
      enqueueSave,
    ]
  );

  const handleLeaveReview = React.useCallback(async () => {
    await flushSaveQueue();
    router.push(onBackHref);
  }, [flushSaveQueue, onBackHref, router]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        submitAction("not-yet");
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        submitAction("known");
      } else if (event.code === "Space") {
        event.preventDefault();
        setFlipped((prev) => !prev);
      } else if (event.code === "Escape") {
        event.preventDefault();
        void handleLeaveReview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleLeaveReview, submitAction]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch || activeAction) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    if (dx > 0) submitAction("known");
    else submitAction("not-yet");
  };

  if (words.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-border/80 pb-4">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void handleLeaveReview()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
            <p className="text-xs text-muted-foreground">Hiện chưa có thẻ nào cần ôn.</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <p className="text-sm text-muted-foreground">
            Bạn đã hoàn thành phiên ôn tập này.
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <div className="rounded-xl border border-border/80 bg-card p-8 shadow-xs space-y-5">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Hoàn thành ôn tập</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Bạn đã ôn xong toàn bộ từ cần ôn trong phiên này.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {queueState.knownCount}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Đã thuộc</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {totalDue}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Thẻ đã ôn</p>
            </div>
          </div>
          <Button onClick={() => void handleLeaveReview()}>
            <Sparkles className="h-4 w-4" />
            <span>Quay lại trang ôn tập</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 overflow-x-hidden pb-16 sm:pb-10">
      {/* Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void handleLeaveReview()}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {setInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Phiên ôn tập SRS • Đánh giá Đã thuộc / Chưa thuộc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="tabular-nums font-semibold px-2.5 py-1">
            Đã thuộc {queueState.knownCount} / {totalDue}
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

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tiến độ phiên ôn tập</span>
          <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      {/* Card Stage */}
      {currentWord && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: activeAction ? 0.985 : 1,
              x: activeAction === "known" ? 180 : activeAction === "not-yet" ? -180 : 0,
              rotate: activeAction === "known" ? 6 : activeAction === "not-yet" ? -6 : 0,
            }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            drag={activeAction ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) < 75) return;
              if (info.offset.x > 0) submitAction("known");
              else submitAction("not-yet");
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <FlashcardDeck
              word={currentWord}
              flipped={flipped}
              frontMode={settings.frontMode}
              autoSpeak={settings.autoSpeak}
              isStarred={false}
              readOnly={true}
              onFlip={() => setFlipped((prev) => !prev)}
              onSpeak={handleSpeak}
              onOpenSettings={() => setSettingsOpen(true)}
              onToggleAutoSpeak={() =>
                persistSettings({ ...settings, autoSpeak: !settings.autoSpeak })
              }
              onToggleStar={() => {}}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Review Controls */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
          <div className="flex justify-start">
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 h-8">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Còn {queueState.queue.length} thẻ</span>
              <span className="sm:hidden">{queueState.queue.length}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => submitAction("not-yet")}
              disabled={!!activeAction}
              className="border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
              aria-label="Chưa thuộc"
            >
              <X className="h-4 w-4" />
              <span>Chưa thuộc</span>
              <kbd className="hidden md:inline-flex ml-1 bg-background/60">←</kbd>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => submitAction("known")}
              disabled={!!activeAction}
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
              aria-label="Đã thuộc"
            >
              <Check className="h-4 w-4" />
              <span>Đã thuộc</span>
              <kbd className="hidden md:inline-flex ml-1 bg-background/60">→</kbd>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant={shuffleEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => applyShuffle(!shuffleEnabled)}
              aria-label="Trộn thẻ"
              title="Trộn thứ tự thẻ"
            >
              <Shuffle className={cn("h-3.5 w-3.5", shuffleEnabled && "rotate-12")} />
              <span className="hidden sm:inline">Trộn thẻ</span>
            </Button>
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Phím tắt:</span>
          <kbd>←</kbd>
          <span>Chưa thuộc (lặp lại)</span>
          <span>•</span>
          <kbd>→</kbd>
          <span>Đã thuộc</span>
          <span>•</span>
          <kbd>Space</kbd>
          <span>lật thẻ</span>
        </div>
      </div>

      <FlashcardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        showFilterOptions={false}
        onSave={(next) => {
          persistSettings(next);
          setFlipped(false);
        }}
      />
    </div>
  );
}
