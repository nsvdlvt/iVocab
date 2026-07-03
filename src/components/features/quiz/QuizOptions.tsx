"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizOptionsProps {
  options: string[];
  correctIndex: number;
}

export function QuizOptions({ options, correctIndex }: QuizOptionsProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option, idx) => {
        const isSelected = selectedIdx === idx;
        const showResult = selectedIdx !== null;
        const isCorrect = idx === correctIndex;

        return (
          <Button
            key={idx}
            variant="outline"
            onClick={() => {
              if (selectedIdx === null) {
                setSelectedIdx(idx);
              }
            }}
            className={cn(
              "rounded-xl h-14 justify-start px-5 text-sm font-medium border-border transition-all cursor-pointer whitespace-normal text-left leading-relaxed",
              showResult && isCorrect && "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold",
              showResult && isSelected && !isCorrect && "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold",
              !showResult && "hover:bg-accent/40 hover:border-border/80 hover:scale-[1.01]"
            )}
            disabled={showResult}
          >
            <span className="mr-3 font-mono text-xs text-muted-foreground bg-muted h-6 w-6 rounded-full flex items-center justify-center border border-border shrink-0">
              {String.fromCharCode(65 + idx)}
            </span>
            {option}
          </Button>
        );
      })}
    </div>
  );
}
