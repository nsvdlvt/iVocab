"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlashcardDeck } from "../flashcard/FlashcardDeck";
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

export function ReviewFlashcardSession({ words, setInfo, onBackHref, reviewSessionId }: ReviewFlashcardSessionProps) {
  const router = useRouter();
  const [queueState, setQueueState] = React.useState<FlashcardReviewQueueState>(() => createFlashcardReviewQueue(words));
  const [flipped, setFlipped] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<FlashcardReviewAction | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const actionTimerRef = React.useRef<number | null>(null);

  const currentWord = queueState.queue[0] ?? null;
  const totalDue = queueState.knownCount + queueState.queue.length;
  const progress = totalDue > 0 ? Math.round((queueState.knownCount / totalDue) * 100) : 0;
  const finished = totalDue > 0 && queueState.queue.length === 0;
  usePreserveScrollPosition(currentWord?.id ?? (finished ? "finished" : "ready"));

  React.useEffect(() => {
    return () => {
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    };
  }, []);

  const submitAction = React.useCallback((action: FlashcardReviewAction) => {
    if (!currentWord || activeAction || finished) return;

    setActiveAction(action);
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);

    actionTimerRef.current = window.setTimeout(() => {
      setQueueState((prev) => advanceFlashcardReviewQueue(prev, action));
      setFlipped(false);
      setActiveAction(null);

      if (action === "known") {
        void fetch("/api/srs/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabularyId: currentWord.id,
            mode: "review",
            answerResult: "correct",
            reviewSessionId,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            console.error("SRS save failed (review flashcard)", await response.text());
            return;
          }
          const data = (await response.json()) as { completed?: boolean };
          if (data.completed) {
            router.push(`/review/session/${reviewSessionId}/complete`);
          }
        }).catch((error) => {
          console.error("SRS save request failed (review flashcard)", error);
        });
      }
    }, 180);
  }, [activeAction, currentWord, finished, reviewSessionId, router]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        submitAction("not-yet");
      } else if (event.code === "ArrowRight" || event.code === "Enter") {
        event.preventDefault();
        submitAction("known");
      } else if (event.code === "Space") {
        event.preventDefault();
        setFlipped((prev) => !prev);
      } else if (event.code === "Escape") {
        event.preventDefault();
        router.push(onBackHref);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBackHref, router, submitAction]);

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
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="rounded-xl">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
            <p className="text-xs text-muted-foreground">No due cards available right now.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">You are all caught up for this review session.</p>
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
            <h2 className="text-3xl font-black text-foreground">Review Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You reviewed all due vocabulary successfully.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{queueState.knownCount}</div>
              <p className="text-xs text-muted-foreground">Known</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-2xl font-extrabold text-foreground">{totalDue}</div>
              <p className="text-xs text-muted-foreground">Due cards</p>
            </div>
          </div>
          <Button onClick={() => router.refresh()} variant="outline" className="rounded-xl gap-2">
            <Sparkles className="h-4 w-4" />
            Review again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="mt-0.5 rounded-xl">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{setInfo.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">SRS review session with Known / Not Yet workflow.</p>
          </div>
        </div>

        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {queueState.knownCount} / {totalDue}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Progress</span>
          <span>{queueState.knownCount} / {totalDue}</span>
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
            dragElastic={0.15}
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
              showIpa={true}
              showExamples={true}
              onFlip={() => setFlipped((prev) => !prev)}
              onSpeak={() => {
                if (!window.speechSynthesis) return;
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentWord.word);
                utterance.lang = "en-US";
                window.speechSynthesis.speak(utterance);
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto w-full">
        <Button
          variant="outline"
          onClick={() => submitAction("not-yet")}
          disabled={!!activeAction}
          className="h-14 rounded-2xl border-rose-200 bg-rose-50/40 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300"
        >
          <X className="mr-2 h-5 w-5" />
          Chưa thuộc
        </Button>
        <Button
          onClick={() => submitAction("known")}
          disabled={!!activeAction}
          className="h-14 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500"
        >
          <Check className="mr-2 h-5 w-5" />
          Đã thuộc
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Keyboard: <span className="font-semibold text-foreground">←</span> Chưa thuộc,{" "}
        <span className="font-semibold text-foreground">→</span> Đã thuộc,{" "}
        <span className="font-semibold text-foreground">Enter</span> Đã thuộc
      </div>
    </div>
  );
}
