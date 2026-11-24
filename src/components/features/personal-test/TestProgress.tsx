"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Layers,
  Sparkles,
  LogOut,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { TestMode } from "@/types/vocabee-test";

interface TestProgressProps {
  testTitle: string;
  totalSets: number;
  currentSetIndex: number;
  currentSetLabel: string;
  currentExerciseIndex: number;
  totalExercisesInSet: number;
  overallProgress: number; // 0 - 100
  mode: TestMode;
  onModeToggle: (mode: TestMode) => void;
  onExit: () => void;
  answeredCount: number;
  totalQuestions: number;
}

const EXERCISE_NAMES = [
  "Matching",
  "Sentence",
  "Synonyms",
  "Cloze",
];

export function TestProgress({
  testTitle,
  totalSets,
  currentSetIndex,
  currentSetLabel,
  currentExerciseIndex,
  totalExercisesInSet,
  overallProgress,
  mode,
  onModeToggle,
  onExit,
  answeredCount,
  totalQuestions,
}: TestProgressProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Top Bar: Title, Mode toggle, Exit */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate" title={testTitle}>
              {testTitle}
            </h2>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono shrink-0">
              Set {currentSetIndex + 1}/{totalSets}
            </Badge>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Selector */}
            <div className="flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/30 text-xs">
              <button
                type="button"
                onClick={() => onModeToggle("practice")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  mode === "practice"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Luyện tập
              </button>
              <button
                type="button"
                onClick={() => onModeToggle("test")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  mode === "test"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
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
          {/* Exercise steps */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {EXERCISE_NAMES.map((name, idx) => {
              const isCurrent = idx === currentExerciseIndex;
              const isCompleted = idx < currentExerciseIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isCurrent
                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono">
                      {idx + 1}
                    </span>
                  )}
                  <span>{name}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-muted-foreground">
            <span className="font-medium text-foreground">
              {currentSetLabel}
            </span>
            <span className="font-mono">
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
