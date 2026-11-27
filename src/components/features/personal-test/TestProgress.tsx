"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogOut, CheckCircle2, Layers, Award, Sparkles, Lock } from "lucide-react";
import { PersonalTestStage, TestMode } from "@/types/vocabee-test";
import { cn } from "@/lib/utils";

interface TestProgressProps {
  testTitle: string;
  totalSets: number;
  currentSetIndex: number;
  currentSetLabel: string;
  stage: PersonalTestStage;
  isResultsStage?: boolean;
  flashcardsCompleted: boolean;
  completedExerciseIndices: number[];
  currentExerciseIndex: number;
  overallProgress: number;
  mode: TestMode;
  onModeToggle: (mode: TestMode) => void;
  onSelectFlashcards: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  onSelectLearn?: () => void;
  onSelectSet?: (setIndex: number) => void;
  learnCompleted?: boolean;
  learnCompletedBySet?: Record<number, boolean>;
  isSetUnlocked?: (setIndex: number) => boolean;
  onExit: () => void;
  answeredCount: number;
  totalQuestions: number;
  flashcardReviewedCount?: number;
  flashcardTotalCount?: number;
  onHeightChange?: (height: number) => void;
}

const EXERCISE_NAMES = ["Matching", "Sentence", "Synonyms", "Cloze"] as const;

export function TestProgress({
  testTitle,
  totalSets,
  currentSetIndex,
  currentSetLabel,
  stage,
  isResultsStage = false,
  flashcardsCompleted,
  completedExerciseIndices,
  currentExerciseIndex,
  overallProgress,
  mode,
  onModeToggle,
  onSelectFlashcards,
  onSelectExercise,
  onSelectLearn,
  onSelectSet,
  learnCompleted = false,
  learnCompletedBySet = {},
  isSetUnlocked,
  onExit,
  answeredCount,
  totalQuestions,
  flashcardReviewedCount = 0,
  flashcardTotalCount = 0,
  onHeightChange,
}: TestProgressProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !onHeightChange) return;

    const update = () => onHeightChange(el.getBoundingClientRect().height);
    update();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const completedSet = React.useMemo(
    () => new Set(completedExerciseIndices),
    [completedExerciseIndices]
  );

  const isFlashcardsActive = !isResultsStage && stage === "flashcards";
  const isFlashcardsDone = isResultsStage || flashcardsCompleted;
  const isLearnActive = !isResultsStage && stage === "learn";
  const isLearnDone = isResultsStage || learnCompleted;

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6"
    >
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Top Bar: Title, Set selector, Mode toggle, Exit */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate" title={testTitle}>
              {testTitle}
            </h2>
            {totalSets > 1 && onSelectSet ? (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {Array.from({ length: totalSets }).map((_, sIdx) => {
                  const unlocked = isSetUnlocked ? isSetUnlocked(sIdx) : true;
                  const setDone = Boolean(learnCompletedBySet[sIdx]);
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => onSelectSet(sIdx)}
                      title={
                        unlocked
                          ? `Set ${sIdx + 1}`
                          : `Hoàn thành bài Learn của Set ${sIdx} để mở khóa`
                      }
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border transition-colors",
                        !unlocked
                          ? "border-border/50 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                          : sIdx === currentSetIndex
                          ? "border-primary bg-primary/10 text-primary cursor-pointer"
                          : setDone
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
                      )}
                    >
                      {!unlocked && <Lock className="h-2.5 w-2.5 shrink-0" />}
                      {unlocked && setDone && sIdx !== currentSetIndex && (
                        <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span>Set {sIdx + 1}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono shrink-0">
                Set {currentSetIndex + 1}/{totalSets}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Selector */}
            <div className="flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/30 text-xs">
              <button
                type="button"
                onClick={() => onModeToggle("practice")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  mode === "practice"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Luyện tập
              </button>
              <button
                type="button"
                onClick={() => onModeToggle("test")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  mode === "test"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Thi thử
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </Button>
          </div>
        </div>

        {/* 6-Stage Horizontally Scrollable Navigation & Progress Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <nav
            aria-label="Các giai đoạn bài kiểm tra"
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1"
          >
            {/* Stage 1: Flashcards */}
            <button
              type="button"
              onClick={onSelectFlashcards}
              disabled={isResultsStage}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                !isResultsStage ? "cursor-pointer" : "cursor-default",
                isFlashcardsActive
                  ? "bg-primary/10 text-primary font-bold border border-primary/30"
                  : isFlashcardsDone
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/15"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {isFlashcardsDone && !isFlashcardsActive ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Layers className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>Flashcards</span>
            </button>

            {/* Stages 2-5: Matching, Sentence, Synonyms, Cloze */}
            {EXERCISE_NAMES.map((name, idx) => {
              const isCurrent =
                !isResultsStage && stage === "exercise" && idx === currentExerciseIndex;
              const isCompleted = isResultsStage || completedSet.has(idx);

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectExercise(idx)}
                  disabled={isResultsStage}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    !isResultsStage ? "cursor-pointer" : "cursor-default",
                    isCurrent
                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/15"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono shrink-0">
                      {idx + 2}
                    </span>
                  )}
                  <span>{name}</span>
                </button>
              );
            })}

            {/* Stage 6: Learn (/learn mode for current Set) */}
            {onSelectLearn && (
              <button
                type="button"
                onClick={onSelectLearn}
                disabled={isResultsStage}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  !isResultsStage ? "cursor-pointer" : "cursor-default",
                  isLearnActive
                    ? "bg-primary/10 text-primary font-bold border border-primary/30"
                    : isLearnDone
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/15"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {isLearnDone && !isLearnActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>Learn</span>
              </button>
            )}

            {/* Stage 7: Results */}
            <button
              type="button"
              disabled
              aria-current={isResultsStage ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                isResultsStage
                  ? "bg-primary/10 text-primary font-bold border border-primary/30"
                  : "bg-muted/30 text-muted-foreground/70 cursor-not-allowed"
              )}
            >
              <Award className="h-3.5 w-3.5 shrink-0" />
              <span>Results</span>
            </button>
          </nav>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-muted-foreground shrink-0">
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {currentSetLabel}
            </span>
            <span className="font-mono shrink-0 tabular-nums">
              {stage === "flashcards" && flashcardTotalCount > 0
                ? `${flashcardReviewedCount}/${flashcardTotalCount} thẻ`
                : stage === "learn"
                ? "Chế độ /learn"
                : `${answeredCount}/${totalQuestions} câu`}
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full">
          <Progress value={overallProgress} className="h-1.5 bg-muted" />
        </div>
      </div>
    </div>
  );
}
