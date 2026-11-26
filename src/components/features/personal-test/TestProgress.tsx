"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogOut, CheckCircle2 } from "lucide-react";
import { TestMode } from "@/types/vocabee-test";
import { cn } from "@/lib/utils";

interface TestProgressProps {
  testTitle: string;
  totalSets: number;
  currentSetIndex: number;
  currentSetLabel: string;
  currentExerciseIndex: number;
  totalExercisesInSet: number;
  overallProgress: number;
  mode: TestMode;
  onModeToggle: (mode: TestMode) => void;
  onSelectExercise: (exerciseIndex: number) => void;
  onSelectSet?: (setIndex: number) => void;
  onExit: () => void;
  answeredCount: number;
  totalQuestions: number;
  onHeightChange?: (height: number) => void;
}

const EXERCISE_NAMES = ["Matching", "Sentence", "Synonyms", "Cloze"];

export function TestProgress({
  testTitle,
  totalSets,
  currentSetIndex,
  currentSetLabel,
  currentExerciseIndex,
  overallProgress,
  mode,
  onModeToggle,
  onSelectExercise,
  onSelectSet,
  onExit,
  answeredCount,
  totalQuestions,
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

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6"
    >
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Top Bar: Title, Mode toggle, Exit */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate" title={testTitle}>
              {testTitle}
            </h2>
            {totalSets > 1 && onSelectSet ? (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {Array.from({ length: totalSets }).map((_, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => onSelectSet(sIdx)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer",
                      sIdx === currentSetIndex
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Set {sIdx + 1}
                  </button>
                ))}
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

        {/* Exercise Stepper Pills & Progress Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {EXERCISE_NAMES.map((name, idx) => {
              const isCurrent = idx === currentExerciseIndex;
              const isCompleted = idx < currentExerciseIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectExercise(idx)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                    isCurrent
                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/15"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono">
                      {idx + 1}
                    </span>
                  )}
                  <span>{name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-muted-foreground">
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {currentSetLabel}
            </span>
            <span className="font-mono shrink-0">
              {answeredCount}/{totalQuestions} câu
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
