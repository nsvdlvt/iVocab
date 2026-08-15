"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function ReadingNavigation({
  current,
  total,
  progress,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  progress: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <Button variant="outline" onClick={onPrev} className="justify-start rounded-full md:w-40">
        <ArrowLeft className="h-4 w-4" />
        Bài trước
      </Button>
      <div className="flex w-full flex-col items-center gap-2 md:max-w-md">
        <div className="text-sm font-medium text-foreground">
          {current} / {total} bài
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>
      <Button onClick={onNext} className="justify-end rounded-full md:w-40">
        Bài tiếp
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
