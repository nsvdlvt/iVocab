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
  const safeTotal = Math.max(totalWords, 1);
  const masteredPercent = Math.round((masteredCount / safeTotal) * 100) || 0;
  const learningPercent = Math.round((learningCount / safeTotal) * 100) || 0;
  const remainingPercent = Math.max(0, 100 - masteredPercent - learningPercent);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold mb-2.5">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Đã thuộc: <strong>{masteredCount}</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Đang học: <strong>{learningCount}</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <span>Chưa học: <strong>{remainingCount}</strong></span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary tabular-nums">
          Độ chính xác: {accuracy}%
        </span>
      </div>

      {/* Tri-color progress track */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex gap-0.5">
        {masteredPercent > 0 && (
          <div
            style={{ width: `${masteredPercent}%` }}
            className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-l-full"
            title={`Đã thuộc: ${masteredCount} từ`}
          />
        )}
        {learningPercent > 0 && (
          <div
            style={{ width: `${learningPercent}%` }}
            className="h-full bg-amber-500 transition-all duration-500 ease-out"
            title={`Đang học: ${learningCount} từ`}
          />
        )}
        {remainingPercent > 0 && (
          <div
            style={{ width: `${remainingPercent}%` }}
            className="h-full bg-muted transition-all duration-500 ease-out rounded-r-full"
            title={`Chưa học: ${remainingCount} từ`}
          />
        )}
      </div>
    </div>
  );
}
