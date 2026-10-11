"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, Award, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";

interface StudySummaryProps {
  totalWords: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  timeString: string;
  onRestart: () => void;
  onBackToSet: () => void;
  title?: string;
}

export function StudySummary({
  totalWords,
  totalQuestions,
  correctCount,
  wrongCount,
  accuracy,
  timeString,
  onRestart,
  onBackToSet,
  title = "Hoàn thành phiên học!",
}: StudySummaryProps) {
  return (
    <div className="w-full max-w-xl mx-auto space-y-6 select-none animate-in fade-in zoom-in-95 duration-300 py-4">
      <SectionCard className="text-center p-6 sm:p-8 space-y-6 border-border/80 rounded-2xl">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Award className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">Bạn đã hoàn thành tất cả các mục từ của vòng này.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="border border-border/60 bg-muted/20 p-4 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Chính xác</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{correctCount}</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-4 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              <XCircle className="h-4 w-4" />
              <span>Sai / Bỏ qua</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{wrongCount}</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-4 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-semibold">
              <Award className="h-4 w-4" />
              <span>Độ chính xác</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{accuracy}%</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-4 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Clock className="h-4 w-4" />
              <span>Thời gian</span>
            </div>
            <p className="text-base font-bold tabular-nums text-foreground truncate pt-1">{timeString}</p>
          </div>
        </div>

        {/* Meta summary text */}
        <p className="text-xs text-muted-foreground font-medium pt-1">
          Tổng số lượt trả lời: <strong>{totalQuestions}</strong> • Tổng số từ vựng: <strong>{totalWords}</strong>
        </p>
      </SectionCard>

      {/* Control Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRestart}
          className="rounded-xl h-11 flex-1 gap-2 text-sm font-semibold border-border/80 hover:bg-muted cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Học lại vòng này</span>
        </Button>
        <Button
          onClick={onBackToSet}
          className="rounded-xl h-11 flex-1 gap-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Quay lại bộ từ</span>
        </Button>
      </div>
    </div>
  );
}
