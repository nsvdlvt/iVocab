"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";

interface FlashcardProgressProps {
  currentIndex: number;
  totalCards: number;
  isProgressMode: boolean;
  knownCount?: number;
  learningCount?: number;
  remainingCount?: number;
}

export function FlashcardProgress({
  currentIndex,
  totalCards,
  isProgressMode,
  knownCount = 0,
  learningCount = 0,
  remainingCount = 0,
}: FlashcardProgressProps) {
  // If total is 0, render empty fallback
  if (totalCards <= 0) return null;

  // ProgressBar percentage calculation
  const progressPercent = Math.min(
    100,
    isProgressMode
      ? Math.round(((knownCount + learningCount) / totalCards) * 100)
      : Math.round(((currentIndex + 1) / totalCards) * 100)
  );

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 select-none">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Tiến độ bài học</span>
        <span>
          {isProgressMode ? `${knownCount + learningCount} / ${totalCards}` : `${currentIndex + 1} / ${totalCards}`} từ
        </span>
      </div>

      <Progress value={progressPercent} className="h-2 rounded-full bg-muted/60" />

      {isProgressMode && (
        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] uppercase font-extrabold tracking-wide text-center">
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 p-2">
            <span>Đã thuộc: {knownCount}</span>
          </div>
          <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-600 dark:text-rose-400 p-2">
            <span>Chưa thuộc: {learningCount}</span>
          </div>
          <div className="rounded-xl border border-muted bg-muted/20 text-muted-foreground p-2">
            <span>Còn lại: {remainingCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
