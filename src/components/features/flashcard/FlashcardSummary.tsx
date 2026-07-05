"use client";

import React from "react";
import { RotateCcw, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardSummaryProps {
  totalCards: number;
  rounds: number;
  accuracy: number;
  timeString: string;
  onRestart: () => void;
  onBackToSet: () => void;
}

export function FlashcardSummary({
  totalCards,
  rounds,
  accuracy,
  timeString,
  onRestart,
  onBackToSet,
}: FlashcardSummaryProps) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 py-10 border border-border rounded-2xl px-6 sm:px-8 bg-card shadow-md my-6 select-none animate-in fade-in duration-300">
      <div className="flex justify-center">
        <div className="rounded-full bg-indigo-500/10 p-5 animate-bounce">
          <BookOpen className="h-10 w-10 text-indigo-500" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-extrabold text-foreground">Hoàn thành bài học!</h3>
        <p className="text-sm text-muted-foreground">
          Bạn đã ghi nhớ thành thạo tất cả từ vựng trong phiên học này.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border p-3.5">
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalCards}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">Từ vựng</p>
        </div>
        <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border p-3.5">
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{accuracy}%</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">Chính xác</p>
        </div>
        <div className="rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border p-3.5">
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{rounds}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">Số vòng</p>
        </div>
        <div className="rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border p-3.5 col-span-2 sm:col-span-1">
          <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 truncate">{timeString}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">Thời gian</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          variant="outline"
          onClick={onBackToSet}
          className="rounded-xl h-11 px-5 cursor-pointer font-medium text-xs gap-1.5 w-full sm:w-auto"
        >
          <Home className="h-4 w-4" />
          Quay về bộ từ
        </Button>
        <Button
          onClick={onRestart}
          className="rounded-xl h-11 px-6 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Học lại bộ thẻ
        </Button>
      </div>
    </div>
  );
}
