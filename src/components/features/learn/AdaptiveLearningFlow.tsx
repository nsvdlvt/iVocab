"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
  XCircle,
  Flame,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSpeak } from "@/hooks/use-speak";
import type {
  ClientAdaptiveQuestion,
  AdaptiveAnswerSubmissionResult,
  AdaptiveSessionSummary,
} from "@/lib/ai/schemas/contextual-mcq";
import type { WordStudyItem } from "@/lib/learning/adaptive-flow-engine";
import { FlashcardDeck } from "@/components/features/flashcard/FlashcardDeck";
import { DictionaryLearningPanel } from "@/components/features/dictionary/DictionaryLearningPanel";
import { InlineDictionaryPopup } from "@/components/features/dictionary/InlineDictionaryPopup";
import { HighlightedExample } from "@/components/common/HighlightedExample";
import { WordSelectionView } from "./WordSelectionView";
import type { VocabularyWithReview } from "@/lib/learning/mastery-selection";

interface AdaptiveLearningFlowProps {
  initialWords: WordStudyItem[];
  setInfo: { id: string; title: string };
  onBackHref?: string;
}

type FlowStage = "loading_check" | "select_words" | "flashcards" | "practice" | "results";
type ActiveMode = "learn" | "dictionary";

export function AdaptiveLearningFlow({
  initialWords,
  setInfo,
  onBackHref = `/u/vocabulary/${setInfo.id}`,
}: AdaptiveLearningFlowProps) {
  const router = useRouter();
  const { speakText } = useSpeak();

  // Active Mode Switch: "learn" | "dictionary"
  const [activeMode, setActiveMode] = useState<ActiveMode>("learn");

  // Learning Flow Stages: "loading_check" | "select_words" | "flashcards" | "practice" | "results"
  const [stage, setStage] = useState<FlowStage>("loading_check");

  // Active selected words being learned in this session
  const [activeWords, setActiveWords] = useState<WordStudyItem[]>(() => initialWords);

  // Active session ID
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Unfinished session resume notification banner
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  // Confirmation dialogs
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [starredMap, setStarredMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const w of initialWords) {
      if ((w as { is_starred?: boolean }).is_starred) map[w.id] = true;
    }
    return map;
  });

  // Adaptive Practice state
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ClientAdaptiveQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AdaptiveAnswerSubmissionResult | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [onlyWeakWordsPractice, setOnlyWeakWordsPractice] = useState(false);
  const [weakWordIdsToTarget, setWeakWordIdsToTarget] = useState<string[]>([]);

  // Results state
  const [sessionSummary, setSessionSummary] = useState<AdaptiveSessionSummary | null>(null);

  // Instant selection lookup state
  const [selectionLookup, setSelectionLookup] = useState<{
    word: string;
    sentence?: string;
    x: number;
    y: number;
  } | null>(null);

  // 1. Initial Check on Mount: Detect unfinished active session for this vocabulary set
  useEffect(() => {
    let isCancelled = false;

    async function checkActiveSession() {
      try {
        const res = await fetch(`/api/learning/adaptive/active?setId=${encodeURIComponent(setInfo.id)}`);
        const data = await res.json();

        if (isCancelled) return;

        if (res.ok && data.success && data.hasActiveSession && data.data) {
          const active = data.data;
          setSessionId(active.sessionId);

          // Restore exact selected words
          if (Array.isArray(active.selectedWordIds) && active.selectedWordIds.length > 0) {
            const idSet = new Set(active.selectedWordIds);
            const filtered = initialWords.filter((w) => idSet.has(w.id));
            if (filtered.length > 0) {
              setActiveWords(filtered);
            }
          }

          // Restore stage and position
          setCardIndex(active.currentCardIndex || 0);
          setReviewedCardIds(new Set(active.reviewedCardIds || []));
          setCurrentStreak(active.streak || 0);
          setHighestStreak(active.highestStreak || 0);

          if (active.currentQuestion) {
            setCurrentQuestion(active.currentQuestion);
          }

          const restoredStage: FlowStage =
            active.stage === "practice" ? "practice" : "flashcards";
          setStage(restoredStage);
          setHasRestoredSession(true);
          toast.info("Đã khôi phục phiên học đang dở của bạn.", {
            description: "Bạn có thể tiếp tục học ngay hoặc chọn 'Tạo lại bài'.",
          });
          return;
        }
      } catch (err) {
        console.warn("[AdaptiveLearningFlow] Active session check error:", err);
      }

      if (!isCancelled) {
        setStage("select_words");
      }
    }

    checkActiveSession();

    return () => {
      isCancelled = true;
    };
  }, [setInfo.id, initialWords]);

  // Checkpoint saver helper
  const saveCheckpoint = useCallback(
    (newStage?: "flashcards" | "practice" | "results", newCardIndex?: number, newReviewed?: string[]) => {
      if (!sessionId) return;
      fetch("/api/learning/adaptive/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          stage: newStage,
          currentCardIndex: typeof newCardIndex === "number" ? newCardIndex : cardIndex,
          reviewedCardIds: newReviewed || Array.from(reviewedCardIds),
        }),
      }).catch((err) => console.warn("[AdaptiveLearningFlow] Checkpoint error:", err));
    },
    [sessionId, cardIndex, reviewedCardIds]
  );

  // Instant selection lookup event listener
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleSelection = (e: MouseEvent | TouchEvent) => {
      if (activeMode !== "learn") return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "[data-inline-popup], [role='dialog'], input, textarea, [data-prevent-selection-lookup]"
        )
      ) {
        return;
      }

      timer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const raw = selection.toString().trim();
        if (!raw) return;

        const clean = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
        if (!clean || clean.length > 80) return;
        if (!/[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/.test(clean)) return;

        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        let sentence: string | undefined = undefined;
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        if (node instanceof HTMLElement) {
          sentence = node.innerText || node.textContent || undefined;
        }

        setSelectionLookup({
          word: clean,
          sentence,
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.bottom),
        });
      }, 60);
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [activeMode]);

  const currentFlashcard = activeWords[cardIndex] ?? null;

  // Auto-speak current flashcard word
  useEffect(() => {
    if (stage === "flashcards" && autoSpeak && currentFlashcard && !flipped) {
      const timer = setTimeout(() => {
        speakText(currentFlashcard.word);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoSpeak, currentFlashcard, flipped, speakText, stage]);

  // Flashcard Next & Prev with automatic checkpoint saving
  const handleFlashcardNext = useCallback(() => {
    if (cardIndex < activeWords.length - 1) {
      const nextIdx = cardIndex + 1;
      setCardIndex(nextIdx);
      setFlipped(false);
      let updatedReviewed = reviewedCardIds;
      if (currentFlashcard) {
        updatedReviewed = new Set([...reviewedCardIds, currentFlashcard.id]);
        setReviewedCardIds(updatedReviewed);
      }
      saveCheckpoint("flashcards", nextIdx, Array.from(updatedReviewed));
    } else if (currentFlashcard) {
      const updatedReviewed = new Set([...reviewedCardIds, currentFlashcard.id]);
      setReviewedCardIds(updatedReviewed);
      saveCheckpoint("flashcards", cardIndex, Array.from(updatedReviewed));
    }
  }, [cardIndex, currentFlashcard, activeWords.length, reviewedCardIds, saveCheckpoint]);

  const handleFlashcardPrev = useCallback(() => {
    if (cardIndex > 0) {
      const prevIdx = cardIndex - 1;
      setCardIndex(prevIdx);
      setFlipped(false);
      saveCheckpoint("flashcards", prevIdx);
    }
  }, [cardIndex, saveCheckpoint]);

  // Flashcard progress update ("Đã thuộc" or "Chưa thuộc")
  const handleFlashcardMark = async (grade: "correct" | "wrong") => {
    if (!currentFlashcard) return;

    const nextReviewed = new Set([...reviewedCardIds, currentFlashcard.id]);
    setReviewedCardIds(nextReviewed);

    fetch("/api/srs/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: currentFlashcard.id,
        mode: "flashcard",
        answerResult: grade,
      }),
    }).catch((err) => console.warn("[flashcard] record progress error:", err));

    toast.success(
      grade === "correct"
        ? `Đã ghi nhận thuộc "${currentFlashcard.word}"`
        : `Sẽ ôn lại "${currentFlashcard.word}"`
    );

    if (cardIndex < activeWords.length - 1) {
      handleFlashcardNext();
    } else {
      saveCheckpoint("flashcards", cardIndex, Array.from(nextReviewed));
    }
  };

  // Start a new session from selected words
  const handleStartFromSelection = async (selectedIds: string[]) => {
    setPracticeLoading(true);
    try {
      const selectedSet = new Set(selectedIds);
      const chosenWords = initialWords.filter((w) => selectedSet.has(w.id));
      setActiveWords(chosenWords);

      const res = await fetch("/api/learning/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: setInfo.id,
          selectedWordIds: selectedIds,
          stage: "flashcards",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể khởi tạo phiên học.");
      }

      setSessionId(data.data.sessionId);
      setCardIndex(0);
      setFlipped(false);
      setReviewedCardIds(new Set());
      setCurrentQuestion(data.data.firstQuestion);
      setStage("flashcards");
      setHasRestoredSession(false);
      toast.success(`Đã chuẩn bị bài học với ${chosenWords.length} từ vựng!`);
    } catch (err) {
      console.error("Start session error:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi khi bắt đầu học.");
    } finally {
      setPracticeLoading(false);
    }
  };

  // Switch to Adaptive Practice stage
  const startAdaptivePractice = useCallback(
    async (targetWeakIds?: string[]) => {
      setPracticeLoading(true);
      setSubmissionResult(null);
      setSelectedOptionIndex(null);
      setActiveHint(null);
      setCurrentStreak(0);

      try {
        if (!sessionId) {
          // If no active session, start one
          await handleStartFromSelection(activeWords.map((w) => w.id));
          setStage("practice");
          return;
        }

        // If session exists, checkpoint stage to practice
        saveCheckpoint("practice");
        setStage("practice");

        // If question is not yet loaded, fetch active question
        if (!currentQuestion) {
          const res = await fetch(`/api/learning/adaptive/active?setId=${encodeURIComponent(setInfo.id)}`);
          const data = await res.json();
          if (res.ok && data.success && data.data?.currentQuestion) {
            setCurrentQuestion(data.data.currentQuestion);
          }
        }
      } catch (err) {
        console.error("Start adaptive practice error:", err);
        toast.error(err instanceof Error ? err.message : "Lỗi khi bắt đầu luyện tập.");
      } finally {
        setPracticeLoading(false);
      }
    },
    [sessionId, activeWords, setInfo.id, currentQuestion, saveCheckpoint]
  );

  // Submit Answer to Adaptive Engine
  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || selectedOptionIndex === null || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/learning/adaptive/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedOptionIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi câu trả lời.");
      }

      const result: AdaptiveAnswerSubmissionResult = data.data;
      setSubmissionResult(result);

      if (result.isCorrect) {
        setCurrentStreak((prev) => {
          const next = prev + 1;
          setHighestStreak((h) => Math.max(h, next));
          return next;
        });
      } else {
        setCurrentStreak(0);
      }
    } catch (err) {
      console.error("Submit answer error:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi khi gửi kết quả.");
    } finally {
      setSubmitting(false);
    }
  };

  // Advance to next adaptive question or complete session
  const handleProceedNextQuestion = async () => {
    if (!sessionId || !submissionResult) return;

    if (submissionResult.sessionCompleted || !submissionResult.nextQuestion) {
      // Complete session
      try {
        const finishRes = await fetch("/api/learning/adaptive/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const finishData = await finishRes.json();
        if (finishRes.ok && finishData.success) {
          setSessionSummary(finishData.data);
          setStage("results");
          toast.success("Chúc mừng bạn đã hoàn thành bài học!");
          return;
        }
      } catch (finishErr) {
        console.error("Finish error:", finishErr);
      }
      setStage("results");
      return;
    }

    // Set next question
    setCurrentQuestion(submissionResult.nextQuestion);
    setSelectedOptionIndex(null);
    setSubmissionResult(null);
    setActiveHint(null);
  };

  // Request supportive hint
  const handleRequestHint = async () => {
    if (!sessionId || !currentQuestion || hintLoading || activeHint) return;

    setHintLoading(true);
    try {
      const res = await fetch("/api/learning/adaptive/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveHint(data.data.hint);
      }
    } catch (err) {
      console.error("Hint error:", err);
    } finally {
      setHintLoading(false);
    }
  };

  // "Tạo lại bài" Action: Invalidate unfinished session and regenerate
  const handleConfirmRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/learning/adaptive/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: setInfo.id,
          selectedWordIds: activeWords.map((w) => w.id),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo lại bài học.");
      }

      setSessionId(data.data.sessionId);
      setCardIndex(0);
      setFlipped(false);
      setReviewedCardIds(new Set());
      setCurrentQuestion(data.data.firstQuestion);
      setSubmissionResult(null);
      setSelectedOptionIndex(null);
      setCurrentStreak(0);
      setHighestStreak(0);
      setStage("flashcards");
      setRegenerateDialogOpen(false);
      setHasRestoredSession(false);
      toast.success("Đã tạo lại bài học mới thành công!");
    } catch (err) {
      console.error("Regenerate session error:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi khi tạo lại bài học.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Return to word selection (abandon active session)
  const handleConfirmAbandonToSelect = async () => {
    try {
      await fetch("/api/learning/adaptive/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: setInfo.id,
        }),
      });
      setSessionId(null);
      setStage("select_words");
      setAbandonDialogOpen(false);
      setHasRestoredSession(false);
    } catch {
      setStage("select_words");
      setAbandonDialogOpen(false);
    }
  };

  // Star toggle
  const toggleStar = async () => {
    if (!currentFlashcard) return;
    const nextStarred = !starredMap[currentFlashcard.id];
    setStarredMap((prev) => ({ ...prev, [currentFlashcard.id]: nextStarred }));

    try {
      await fetch("/api/vocabulary/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabularyId: currentFlashcard.id,
          isStarred: nextStarred,
        }),
      });
      toast.success(
        nextStarred
          ? `Đã gắn sao "${currentFlashcard.word}"`
          : `Đã bỏ gắn sao "${currentFlashcard.word}"`
      );
    } catch {
      setStarredMap((prev) => ({ ...prev, [currentFlashcard.id]: !nextStarred }));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== "learn") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (stage === "flashcards") {
        if (e.code === "Space") {
          e.preventDefault();
          setFlipped((prev) => !prev);
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          handleFlashcardPrev();
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          handleFlashcardNext();
        }
      } else if (stage === "practice") {
        if (submissionResult) {
          if (e.code === "Enter" || e.code === "Space") {
            e.preventDefault();
            handleProceedNextQuestion();
          }
        } else if (currentQuestion) {
          if (["Digit1", "KeyA"].includes(e.code)) setSelectedOptionIndex(0);
          else if (["Digit2", "KeyB"].includes(e.code)) setSelectedOptionIndex(1);
          else if (["Digit3", "KeyC"].includes(e.code)) setSelectedOptionIndex(2);
          else if (["Digit4", "KeyD"].includes(e.code)) setSelectedOptionIndex(3);
          else if (e.code === "Enter" && selectedOptionIndex !== null) {
            e.preventDefault();
            handleSubmitAnswer();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    handleFlashcardNext,
    handleFlashcardPrev,
    handleProceedNextQuestion,
    handleSubmitAnswer,
    selectedOptionIndex,
    stage,
    submissionResult,
  ]);

  const flashcardProgressPct = Math.round(
    (reviewedCardIds.size / Math.max(1, activeWords.length)) * 100
  );

  // Loading Check Stage
  if (stage === "loading_check") {
    return (
      <div className="flex w-full flex-col items-center justify-center py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Đang kiểm tra tiến độ học tập...
        </p>
      </div>
    );
  }

  // STAGE 0: SELECT WORDS INTERFACE
  if (stage === "select_words") {
    return (
      <WordSelectionView
        words={initialWords as VocabularyWithReview[]}
        setInfo={setInfo}
        onStartLearning={handleStartFromSelection}
        isLoading={practiceLoading}
        onBackHref={onBackHref}
      />
    );
  }

  // Render STAGE 1: FLASHCARDS
  const renderFlashcardsStage = () => {
    const allCardsReviewed =
      reviewedCardIds.size >= activeWords.length ||
      cardIndex >= activeWords.length - 1;

    return (
      <div className="flex w-full flex-col gap-4 sm:gap-6 pb-6">
        {/* Progress & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Thẻ {cardIndex + 1} / {activeWords.length} (Đã xem: {reviewedCardIds.size}/{activeWords.length})
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {flashcardProgressPct}%
              </span>
            </div>
            <Progress value={flashcardProgressPct} className="h-2 rounded-full" />
          </div>

          <Button
            onClick={() => startAdaptivePractice()}
            disabled={practiceLoading}
            className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 shrink-0 self-end sm:self-auto"
            size="sm"
          >
            {practiceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Vào Luyện tập AI thích ứng</span>
          </Button>
        </div>

        {/* Flashcard 3D Deck */}
        {currentFlashcard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <FlashcardDeck
              word={currentFlashcard as any}
              flipped={flipped}
              frontMode="term"
              onFlip={() => setFlipped((prev) => !prev)}
              onSpeak={() => speakText(currentFlashcard.word)}
              onOpenSettings={() => {}}
              onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
              onToggleStar={toggleStar}
              autoSpeak={autoSpeak}
              isStarred={Boolean(starredMap[currentFlashcard.id])}
              readOnly={false}
            />
          </motion.div>
        )}

        {/* Flashcard Controls */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleFlashcardMark("wrong")}
              className="flex-1 border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300 font-semibold rounded-xl"
            >
              <X className="h-4 w-4 mr-1.5" />
              <span>Chưa thuộc</span>
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={handleFlashcardPrev}
                disabled={cardIndex === 0}
                aria-label="Thẻ trước"
                className="rounded-xl"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setFlipped((prev) => !prev)}
                aria-label="Lật thẻ"
                className="rounded-xl px-3 text-xs font-semibold"
              >
                Lật mặt
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={handleFlashcardNext}
                disabled={cardIndex >= activeWords.length - 1}
                aria-label="Thẻ tiếp theo"
                className="rounded-xl"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleFlashcardMark("correct")}
              className="flex-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 font-semibold rounded-xl"
            >
              <Check className="h-4 w-4 mr-1.5" />
              <span>Đã thuộc</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
            <span>Phím tắt:</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Space</kbd> lật mặt
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40 inline-block" />
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Phím mũi tên</kbd> chuyển thẻ
          </div>
        </div>

        {/* Transition Prompt when cards are viewed */}
        {allCardsReviewed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Bạn đã duyệt qua các thẻ từ vựng!
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Chuyển ngay sang phần <strong>Luyện tập AI thích ứng</strong> với các câu hỏi tình huống ngữ cảnh chuẩn xác theo trình độ của bạn.
              </p>
            </div>
            <Button
              onClick={() => startAdaptivePractice()}
              disabled={practiceLoading}
              size="lg"
              className="gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Bắt đầu Luyện tập AI thích ứng ngay</span>
            </Button>
          </motion.div>
        )}
      </div>
    );
  };

  // Render STAGE 2: AI ADAPTIVE PRACTICE
  const renderPracticeStage = () => {
    if (practiceLoading || !currentQuestion) {
      return (
        <div className="flex w-full flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-600 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              AI đang chuẩn bị bài tập thích ứng...
            </h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Hệ thống đang chuẩn bị các câu hỏi ngữ cảnh cao cấp với các đáp án gây nhiễu tinh tế phù hợp với các từ bạn đã chọn.
            </p>
          </div>
        </div>
      );
    }

    const alphabet = ["A", "B", "C", "D"];
    const sentenceParts = currentQuestion.sentence.split("______");

    return (
      <div className="flex w-full flex-col gap-5 pb-6">
        {/* Practice Navigation & HUD */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveCheckpoint("flashcards");
              setStage("flashcards");
            }}
            aria-label="Quay lại flashcards"
            className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Flashcards</span>
          </Button>

          <div className="flex items-center gap-2">
            {currentStreak > 1 && (
              <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-2.5 py-1 text-xs">
                <Flame className="h-3.5 w-3.5 fill-current" />
                Streak: {currentStreak}
              </Badge>
            )}
            <Badge variant="outline" className="tabular-nums font-semibold px-2.5 py-1 text-xs">
              Câu {currentQuestion.questionNumber} / {currentQuestion.totalEstimated}
            </Badge>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentQuestion.difficulty === "challenging" ? (
                <Badge variant="destructive" className="rounded-lg text-[11px] font-semibold">
                  Ngữ cảnh nâng cao
                </Badge>
              ) : currentQuestion.difficulty === "medium" ? (
                <Badge variant="warning" className="rounded-lg text-[11px] font-semibold">
                  Cụm từ & Collocations
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-lg text-[11px] font-semibold">
                  Nhận biết & Củng cố
                </Badge>
              )}

              {onlyWeakWordsPractice && (
                <Badge variant="outline" className="text-[11px] border-rose-500/30 text-rose-600">
                  Luyện từ chưa thuộc
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestHint}
              disabled={hintLoading || Boolean(activeHint)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>{activeHint ? "Đã mở gợi ý" : "Gợi ý"}</span>
            </Button>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {currentQuestion.prompt}
          </p>

          {/* Context Sentence */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-5 text-base sm:text-lg leading-relaxed text-foreground font-medium select-text cursor-text">
            {sentenceParts[0]}
            <span className="inline-flex min-w-[100px] items-center justify-center rounded-lg border-2 border-dashed border-primary/60 bg-primary/10 px-3 py-0.5 font-bold text-primary mx-1.5 select-text">
              {submissionResult
                ? currentQuestion.options[submissionResult.correctAnswerIndex]
                : selectedOptionIndex !== null
                ? currentQuestion.options[selectedOptionIndex]
                : "______"}
            </span>
            {sentenceParts[1]}
          </div>

          {/* Active Hint */}
          {activeHint && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200 select-text"
            >
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span><strong>Gợi ý:</strong> {activeHint}</span>
            </motion.div>
          )}

          {/* 4 Contextual Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              const letter = alphabet[idx];

              let optionStyle =
                "border-border/80 bg-card hover:bg-muted/50 hover:border-gray-400 dark:hover:border-neutral-600 text-foreground";

              if (submissionResult) {
                if (idx === submissionResult.correctAnswerIndex) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/30";
                } else if (isSelected) {
                  optionStyle =
                    "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/30";
                } else {
                  optionStyle = "border-border/60 opacity-60 text-muted-foreground";
                }
              } else if (isSelected) {
                optionStyle =
                  "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={Boolean(submissionResult) || submitting}
                  onClick={() => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) return;
                    setSelectedOptionIndex(idx);
                  }}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl border p-4 text-left text-sm transition-all cursor-pointer",
                    optionStyle
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold select-none",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/60 text-muted-foreground"
                    )}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 font-medium text-sm leading-snug select-text">
                    {option}
                  </span>
                  {submissionResult && idx === submissionResult.correctAnswerIndex && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  )}
                  {submissionResult && isSelected && idx !== submissionResult.correctAnswerIndex && (
                    <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          {!submissionResult ? (
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedOptionIndex === null || submitting}
                size="lg"
                className="gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                <span>Kiểm tra</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-5 pt-4 select-text cursor-text"
            >
              <div className="flex items-center gap-2">
                {submissionResult.isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Chính xác! Câu trả lời rất thuyết phục.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <XCircle className="h-5 w-5" />
                    <span>
                      Chưa chính xác. Đáp án đúng là {alphabet[submissionResult.correctAnswerIndex]}. {currentQuestion.options[submissionResult.correctAnswerIndex]}
                    </span>
                  </div>
                )}
              </div>

              {/* Completed Sentence & Example Translation Feedback */}
              {(() => {
                const correctWord = currentQuestion.options[submissionResult.correctAnswerIndex] || currentQuestion.targetWord;
                const completedSentence = currentQuestion.sentence.replace("______", correctWord);
                const exampleTranslation =
                  submissionResult.exampleTranslation ||
                  (currentQuestion.vocabularyId
                    ? activeWords.find((w) => w.id === currentQuestion.vocabularyId)?.example_translation
                    : null);
                const meaning =
                  submissionResult.meaning ||
                  (currentQuestion.vocabularyId
                    ? activeWords.find((w) => w.id === currentQuestion.vocabularyId)?.meaning
                    : "");

                return (
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      Ngữ cảnh câu hoàn chỉnh & bản dịch
                    </p>
                    <HighlightedExample
                      word={correctWord}
                      meaning={meaning || ""}
                      example={completedSentence}
                      exampleTranslation={exampleTranslation}
                      compact
                    />
                  </div>
                );
              })()}

              {/* Explanation */}
              <div className="space-y-1 text-xs sm:text-sm text-foreground/90 leading-relaxed border-t border-border/60 pt-3">
                <p className="font-semibold text-foreground">
                  Lý do lựa chọn:
                </p>
                <p className="text-muted-foreground">
                  {submissionResult.explanation}
                </p>
              </div>

              {/* Distractor Analysis */}
              {submissionResult.whyDistractorWrong && (
                <div className="space-y-1 text-xs sm:text-sm text-foreground/90 leading-relaxed bg-card/60 rounded-lg p-3 border border-border/60">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Phân biệt với đáp án gây nhiễu</span>
                    <Badge variant="outline" className="text-[11px]">
                      {submissionResult.strongestDistractor}
                    </Badge>
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {submissionResult.whyDistractorWrong}
                  </p>
                </div>
              )}

              {/* Next Question CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={handleProceedNextQuestion}
                  size="lg"
                  className="gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <span>{submissionResult.sessionCompleted ? "Xem kết quả phiên học" : "Câu tiếp theo"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // Render STAGE 3: RESULTS
  const renderResultsStage = () => (
    <div className="flex w-full flex-col gap-6 py-4 pb-12 select-text">
      {/* Header Trophy Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-xs space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
          <Trophy className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hoàn thành phiên học!
          </h1>
          <p className="text-sm text-muted-foreground">
            Bộ từ vựng: <strong>{setInfo.title}</strong>
          </p>
        </div>

        {/* Score & Accuracy Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-center">
            <span className="text-xs text-muted-foreground block">Độ chính xác</span>
            <span className="text-2xl font-black tabular-nums text-purple-600 dark:text-purple-400">
              {sessionSummary?.accuracy ?? 0}%
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-center">
            <span className="text-xs text-muted-foreground block">Câu trả lời đúng</span>
            <span className="text-2xl font-black tabular-nums text-foreground">
              {sessionSummary?.correctCount ?? 0} / {sessionSummary?.totalQuestions ?? 0}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/70 bg-muted/30 p-3.5 text-center">
            <span className="text-xs text-muted-foreground block">Streak cao nhất</span>
            <span className="text-2xl font-black tabular-nums text-amber-500">
              {highestStreak}
            </span>
          </div>
        </div>

        {/* Personalized AI Feedback */}
        {sessionSummary?.aiRecommendation && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs sm:text-sm text-foreground/90 text-left max-w-xl mx-auto space-y-1.5">
            <p className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Nhận xét cá nhân hóa từ AI:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {sessionSummary.aiRecommendation}
            </p>
          </div>
        )}
      </div>

      {/* Weak Words Section ("Từ cần ôn thêm") */}
      {sessionSummary?.weakWords && sessionSummary.weakWords.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Từ cần ôn thêm ({sessionSummary.weakWords.length} từ)
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startAdaptivePractice(sessionSummary.weakWords.map((w) => w.id))}
              className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Luyện ngay từ yếu
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {sessionSummary.weakWords.map((w) => {
              const fullWord = activeWords.find((item) => item.id === w.id);
              const example = w.example || fullWord?.example;
              const exampleTranslation = w.example_translation || fullWord?.example_translation;

              return (
                <div key={w.id} className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{w.word}</span>
                      {w.ipa && <span className="font-mono text-xs text-muted-foreground">/{w.ipa}/</span>}
                      <span className="text-xs text-muted-foreground">— {w.meaning}</span>
                    </div>
                    <Badge variant="outline" className="text-[11px] border-rose-500/30 text-rose-600">
                      {w.wrongCount} lần chưa đúng
                    </Badge>
                  </div>
                  {(example || exampleTranslation) && (
                    <HighlightedExample
                      word={w.word}
                      meaning={w.meaning}
                      example={example}
                      exampleTranslation={exampleTranslation}
                      compact
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improved Words Section */}
      {sessionSummary?.improvedWords && sessionSummary.improvedWords.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Từ tiến bộ & củng cố ghi nhớ ({sessionSummary.improvedWords.length} từ)
          </h2>

          <div className="divide-y divide-border/60">
            {sessionSummary.improvedWords.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{w.word}</span>
                  <span className="text-xs text-muted-foreground">— {w.meaning}</span>
                </div>
                <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-600 inline-flex items-center gap-1">
                  <span>Lv{w.previousLevel}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Lv{w.newLevel}</span>
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setCardIndex(0);
            setFlipped(false);
            setStage("flashcards");
          }}
          className="h-12 gap-2 rounded-xl font-semibold border-border hover:bg-muted"
        >
          <Layers className="h-4 w-4" />
          <span>Ôn lại flashcards</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setStage("select_words");
          }}
          className="h-12 gap-2 rounded-xl font-semibold border-border hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Chọn từ học mới</span>
        </Button>

        <Button
          size="lg"
          onClick={() => router.push(onBackHref)}
          className="h-12 gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
        >
          <span>Về trang bộ từ</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-12 select-text">
      {/* Header Bar with Back button, Set title, Stage indicator, and "Tạo lại bài" button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => {
              if (stage === "flashcards" || stage === "practice") {
                // Return to set, unfinished session remains safely persisted in DB!
                router.push(onBackHref);
              } else {
                router.push(onBackHref);
              }
            }}
            aria-label="Quay lại chi tiết bộ từ"
            className="rounded-xl shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                {setInfo.title}
              </h1>
              {activeMode === "learn" ? (
                <Badge
                  variant={stage === "practice" ? "default" : "secondary"}
                  className="gap-1 font-semibold text-xs hidden sm:inline-flex shrink-0"
                >
                  {stage === "flashcards" ? (
                    <>
                      <Layers className="h-3 w-3" />
                      Flashcards
                    </>
                  ) : stage === "practice" ? (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Luyện tập AI
                    </>
                  ) : (
                    <>
                      <Trophy className="h-3 w-3 text-amber-500" />
                      Kết quả
                    </>
                  )}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 font-semibold text-xs hidden sm:inline-flex shrink-0">
                  <Search className="h-3 w-3" />
                  Từ điển
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {activeMode === "learn"
                ? stage === "flashcards"
                  ? `Giai đoạn 1: Flashcards (${activeWords.length} từ đã chọn)`
                  : stage === "practice"
                  ? "Giai đoạn 2: Luyện tập ngữ cảnh thích ứng"
                  : "Hoàn thành phiên học & đánh giá kết quả"
                : "Tra cứu từ điển Anh - Việt chuyên sâu"}
            </p>
          </div>
        </div>

        {/* Right Header Actions: "Tạo lại bài" + Mode Tabs */}
        <div className="flex items-center gap-2">
          {/* Prominent "Tạo lại bài" button positioned in top-right for unfinished sessions */}
          {(stage === "flashcards" || stage === "practice") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRegenerateDialogOpen(true)}
              className="gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground border-border/80"
              title="Tạo lại bài học mới với danh sách từ đã chọn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Tạo lại bài</span>
            </Button>
          )}

          {/* Mode Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Chế độ học tập và tra cứu"
            className="flex items-center gap-1 p-1 rounded-2xl bg-muted/70 border border-border/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "learn"}
              onClick={() => setActiveMode("learn")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeMode === "learn"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Học từ</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "dictionary"}
              onClick={() => setActiveMode("dictionary")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeMode === "dictionary"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Tra từ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restored Session Notice Banner */}
      {hasRestoredSession && (stage === "flashcards" || stage === "practice") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-xs text-sky-950 dark:text-sky-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-sky-500" />
            <span>
              <strong>Phiên học đang dở đã được khôi phục:</strong> Bạn đang tiếp tục phiên học trước đó với {activeWords.length} từ đã chọn.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setAbandonDialogOpen(true)}
              className="border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 text-[11px]"
            >
              Chọn lại từ vựng
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setHasRestoredSession(false)}
              className="text-sky-600 dark:text-sky-400 text-[11px]"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {/* Tab 1: HỌC TỪ */}
      <div className={activeMode === "learn" ? "block space-y-4" : "hidden"}>
        {stage === "flashcards" && renderFlashcardsStage()}
        {stage === "practice" && renderPracticeStage()}
        {stage === "results" && renderResultsStage()}
      </div>

      {/* Tab 2: TRA TỪ */}
      <div className={activeMode === "dictionary" ? "block" : "hidden"}>
        <DictionaryLearningPanel />
      </div>

      {/* Confirmation Dialog: "Tạo lại bài" */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              <span>Tạo lại bài học?</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground pt-1.5">
              Tiến độ của phiên học hiện tại sẽ bị hủy và thay thế bằng bài học mới tạo từ danh sách <strong>{activeWords.length} từ vựng</strong> bạn đã chọn. Bạn có chắc chắn muốn tạo lại bài không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
              disabled={isRegenerating}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRegenerate}
              disabled={isRegenerating}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5"
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>Tạo lại bài ngay</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Return to Word Selection */}
      <Dialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>Chọn lại danh sách từ vựng?</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground pt-1.5">
              Hành động này sẽ hủy phiên học đang dở và mở lại màn hình chọn từ để bạn tùy chỉnh danh sách từ cần học. Bạn có chắc chắn muốn tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbandonDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAbandonToSelect}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Xác nhận & Chọn lại từ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Word Definition Popup */}
      {selectionLookup && (
        <InlineDictionaryPopup
          word={selectionLookup.word}
          sentence={selectionLookup.sentence}
          x={selectionLookup.x}
          y={selectionLookup.y}
          onClose={() => setSelectionLookup(null)}
        />
      )}
    </div>
  );
}
