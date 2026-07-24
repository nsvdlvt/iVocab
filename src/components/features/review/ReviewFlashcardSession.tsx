"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Layers3, Shuffle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlashcardDeck } from "../flashcard/FlashcardDeck";
import { FlashcardSettingsDialog, FlashcardSettingsState } from "../flashcard/FlashcardSettingsDialog";
import { FlashcardRow } from "../flashcard/flashcard-utils";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";
import {
  advanceFlashcardReviewQueue,
  createFlashcardReviewQueue,
  FlashcardReviewAction,
  FlashcardReviewQueueState,
} from "../flashcard/flashcard-review-queue";

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
  return orderIds.map((id) => byId.get(id)).filter((word): word is FlashcardRow => Boolean(word));
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
    const queue = parsed.orderIds?.length ? orderWordsByIds(words, parsed.orderIds) : words;

    return { enabled, queue: queue.length > 0 ? queue : words };
  } catch {
    return { enabled: false, queue: words };
  }
}

export function ReviewFlashcardSession({ words, setInfo, onBackHref, reviewSessionId }: ReviewFlashcardSessionProps) {
  const router = useRouter();
  const initialShuffleState = React.useMemo(() => loadShuffleState(reviewSessionId, words), [reviewSessionId, words]);
  const [queueState, setQueueState] = React.useState<FlashcardReviewQueueState>(() => createFlashcardReviewQueue(initialShuffleState.queue));
  const [shuffleEnabled, setShuffleEnabled] = React.useState<boolean>(() => initialShuffleState.enabled);
  const [settings, setSettings] = React.useState<FlashcardSettingsState>(loadDefaultSettings);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [flipped, setFlipped] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<FlashcardReviewAction | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const actionTimerRef = React.useRef<number | null>(null);
  const knownIdsRef = React.useRef<Set<string>>(new Set());
  const pendingSaveRef = React.useRef<Promise<void> | null>(null);

  const currentWord = queueState.queue[0] ?? null;
  const totalDue = queueState.knownCount + queueState.queue.length;
  const progress = totalDue > 0 ? Math.round((queueState.knownCount / totalDue) * 100) : 0;
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

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const nextState: ReviewFlashcardShuffleState = {
      enabled: shuffleEnabled,
      orderIds: queueState.queue.map((word) => word.id),
    };
    window.localStorage.setItem(getShuffleStorageKey(reviewSessionId), JSON.stringify(nextState));
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

  const submitAction = React.useCallback((action: FlashcardReviewAction) => {
    if (!currentWord || activeAction || finished) return;

    setActiveAction(action);
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);

    actionTimerRef.current = window.setTimeout(() => {
      if (action === "known" && currentWord) {
        knownIdsRef.current.add(currentWord.id);
      }

      setQueueState((prev) => advanceFlashcardReviewQueue(prev, action));
      setFlipped(false);
      setActiveAction(null);

      if (action === "known") {
        pendingSaveRef.current = fetch("/api/srs/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabularyId: currentWord.id,
            mode: "review",
            answerResult: "correct",
            reviewSessionId,
          }),
          keepalive: true,
        })
          .then(async (response) => {
            if (!response.ok) {
              console.error("SRS save failed (review flashcard)", await response.text());
              return;
            }
            const data = (await response.json()) as { completed?: boolean };
            if (data.completed) {
              router.push(`/review/session/${reviewSessionId}/complete`);
            }
          })
          .catch((error) => {
            console.error("SRS save request failed (review flashcard)", error);
          })
          .finally(() => {
            pendingSaveRef.current = null;
          });
      }
    }, 180);
  }, [activeAction, currentWord, finished, reviewSessionId, router]);

  const handleLeaveReview = React.useCallback(async () => {
    if (pendingSaveRef.current) {
      try {
        await pendingSaveRef.current;
      } catch {
        // The save handler already logs errors; continue navigation.
      }
    }
    router.push(onBackHref);
  }, [onBackHref, router]);

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
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => void handleLeaveReview()} className="rounded-xl">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
            <p className="text-xs text-muted-foreground">Hiện chưa có thẻ nào cần ôn.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Bạn đã hoàn thành phiên ôn tập này.</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <div className="rounded-3xl border bg-card p-10 shadow-sm space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">Hoàn thành ôn tập</h2>
            <p className="mt-2 text-sm text-muted-foreground">Bạn đã ôn xong toàn bộ từ cần ôn trong phiên này.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{queueState.knownCount}</div>
              <p className="text-xs text-muted-foreground">Đã thuộc</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-2xl font-extrabold text-foreground">{totalDue}</div>
              <p className="text-xs text-muted-foreground">Thẻ cần ôn</p>
            </div>
          </div>
          <Button onClick={() => void handleLeaveReview()} variant="outline" className="rounded-xl gap-2">
            <Sparkles className="h-4 w-4" />
            Quay lại trang ôn tập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 overflow-x-hidden pb-24 sm:pb-10">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="mt-0.5 rounded-xl">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{setInfo.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Phiên ôn tập SRS với luồng Đã thuộc / Chưa thuộc.</p>
          </div>
        </div>

        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {queueState.knownCount} / {totalDue}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Tiến độ</span>
          <span>
            {queueState.knownCount} / {totalDue}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {currentWord && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: activeAction ? 0.98 : 1,
              x: activeAction === "known" ? 220 : activeAction === "not-yet" ? -220 : 0,
              rotate: activeAction === "known" ? 8 : activeAction === "not-yet" ? -8 : 0,
            }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
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
            className="pt-2"
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
              onToggleAutoSpeak={() => persistSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
              onToggleStar={() => {}}
            />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-3 px-1 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-500">
          <span className="font-medium">Phím tắt:</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">←</kbd>
          <span>Chưa thuộc</span>
          <span className="text-slate-300">•</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">→</kbd>
          <span>Đã thuộc</span>
          <span className="text-slate-300">•</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">Space</kbd>
          <span>lật thẻ</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex justify-start">
            <Button
              type="button"
              variant="ghost"
              disabled
              className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-600 px-4 text-white shadow-sm disabled:cursor-default disabled:opacity-100"
              aria-label="Progress mode locked"
            >
              <Layers3 className="h-4 w-4 text-white" />
              <span className="text-sm font-medium">Tiến độ</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => submitAction("not-yet")}
              disabled={!!activeAction}
              className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 shadow-sm transition-all duration-200 hover:bg-rose-100 disabled:opacity-40"
              aria-label="Chưa thuộc"
            >
              <X className="h-4 w-4" />
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                Chưa thuộc
              </span>
            </Button>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Thẻ {queueState.knownCount + 1} / {totalDue}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => submitAction("known")}
              disabled={!!activeAction}
              className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-100 disabled:opacity-40"
              aria-label="Đã thuộc"
            >
              <Check className="h-4 w-4" />
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                Đã thuộc
              </span>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => applyShuffle(!shuffleEnabled)}
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
                Trộn thẻ
              </span>
            </Button>
          </div>
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
