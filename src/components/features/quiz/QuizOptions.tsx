"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizOptionsProps {
  options: string[];
  correctIndex: number;
  /** Called after the user selects an option (after a short reveal delay). */
  onAnswer?: (wasCorrect: boolean) => void;
}

export function QuizOptions({ options, correctIndex, onAnswer }: QuizOptionsProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return; // already answered
    setSelectedIdx(idx);

    // Wait 1s to show correct/wrong color, then advance
    if (onAnswer) {
      setTimeout(() => {
        onAnswer(idx === correctIndex);
        setSelectedIdx(null);
      }, 1000);
    }
  };

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
            onClick={() => handleSelect(idx)}
            className={cn(
              "rounded-xl min-h-14 h-auto py-3.5 justify-start px-4 text-sm font-semibold border-border bg-card transition-all cursor-pointer whitespace-normal text-left leading-relaxed",
              showResult && isCorrect && "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold",
              showResult && isSelected && !isCorrect && "bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold",
              !showResult && "hover:bg-primary/5 hover:border-primary/40"
            )}
            disabled={showResult}
          >
            <kbd
              className={cn(
                "mr-3 font-mono text-xs h-7 w-7 rounded-lg flex items-center justify-center border shrink-0",
                showResult && isCorrect
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : showResult && isSelected && !isCorrect
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-muted text-muted-foreground border-border"
              )}
            >
              {String.fromCharCode(65 + idx)}
            </kbd>
            <span className="flex-1">{option}</span>
          </Button>
        );
      })}
    </div>
  );
}
