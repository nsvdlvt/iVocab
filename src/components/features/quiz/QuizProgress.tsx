"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const percent = Math.min(Math.round((current / total) * 100), 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
        <span>Bài thi thử thách</span>
        <span>Câu hỏi {current} / {total}</span>
      </div>
      <Progress value={percent} className="h-1.5 rounded-full" />
    </div>
  );
}
