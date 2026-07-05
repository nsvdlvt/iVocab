"use client";

import React from "react";

interface StudyProgressProps {
  totalWords: number;
  masteredCount: number;
  learningCount: number;
  remainingCount: number;
  accuracy: number;
}

export function StudyProgress({
  totalWords,
  masteredCount,
  learningCount,
  remainingCount,
  accuracy,
}: StudyProgressProps) {
  const masteredPercent = Math.round((masteredCount / totalWords) * 100) || 0;
  const learningPercent = Math.round((learningCount / totalWords) * 100) || 0;
  const remainingPercent = 100 - masteredPercent - learningPercent;

  return (
    <div className="w-full max-w-xl mx-auto border border-border/80 bg-card rounded-2xl p-4 shadow-xs select-none">
      <div className="flex items-center justify-between text-xs font-bold mb-2">
        <span className="text-muted-foreground">Tiến độ học tập</span>
        <span className="text-indigo-600 dark:text-indigo-400">Độ chính xác: {accuracy}%</span>
      </div>

      {/* Tri-color progress track */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
        <div
          style={{ width: `${masteredPercent}%` }}
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          title={`Đã thuộc: ${masteredCount} từ`}
        />
        <div
          style={{ width: `${learningPercent}%` }}
          className="h-full bg-amber-500 transition-all duration-500 ease-out"
          title={`Đang học: ${learningCount} từ`}
        />
        <div
          style={{ width: `${remainingPercent}%` }}
          className="h-full bg-muted transition-all duration-500 ease-out"
          title={`Chưa học: ${remainingCount} từ`}
        />
      </div>

      {/* Progress stats details */}
      <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Đã thuộc ({masteredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Đang học ({learningCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted border border-border" />
          <span>Chưa học ({remainingCount})</span>
        </div>
      </div>
    </div>
  );
}
