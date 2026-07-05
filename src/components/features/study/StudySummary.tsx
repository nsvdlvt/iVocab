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
    <div className="w-full max-w-xl mx-auto space-y-6 select-none animate-in fade-in zoom-in-95 duration-300">
      <SectionCard className="text-center p-6 space-y-4 border-border/80">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <Award className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">Bạn đã hoàn thành tất cả các mục từ của vòng này.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="border border-border/60 bg-muted/20 p-3 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chính xác</span>
            </div>
            <p className="text-lg font-black text-foreground">{correctCount}</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-3 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-bold">
              <XCircle className="h-3.5 w-3.5" />
              <span>Sai/Bỏ qua</span>
            </div>
            <p className="text-lg font-black text-foreground">{wrongCount}</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-3 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-bold">
              <Award className="h-3.5 w-3.5" />
              <span>Độ chính xác</span>
            </div>
            <p className="text-lg font-black text-foreground">{accuracy}%</p>
          </div>

          <div className="border border-border/60 bg-muted/20 p-3 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>Thời gian</span>
            </div>
            <p className="text-sm font-black text-foreground truncate">{timeString}</p>
          </div>
        </div>

        {/* Meta summary text */}
        <p className="text-[11px] text-muted-foreground/80 font-medium pt-1">
          Tổng số câu hỏi: {totalQuestions} • Tổng số từ vựng: {totalWords}
        </p>
      </SectionCard>

      {/* Control Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRestart}
          className="rounded-xl h-11 flex-1 gap-1.5 text-xs font-bold border-border/80 hover:bg-muted cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Học lại vòng này</span>
        </Button>
        <Button
          onClick={onBackToSet}
          className="rounded-xl h-11 flex-1 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Quay lại bộ từ</span>
        </Button>
      </div>
    </div>
  );
}
