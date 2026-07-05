"use client";

import React, { useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LearnQuestion, AnswerState } from "@/lib/learning/question-types";
import { cn } from "@/lib/utils";

interface WordDictationProps {
  question: LearnQuestion;
  inputValue: string;
  answerState: AnswerState;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  onSpeakPrompt?: () => void;
}

export function WordDictation({
  question,
  inputValue,
  answerState,
  onInputChange,
  onSubmit,
  onSkip,
  onSpeakPrompt,
}: WordDictationProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmitted = answerState !== "unanswered";

  useEffect(() => {
    if (!isSubmitted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSubmitted, question]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!isSubmitted && inputValue.trim()) {
        onSubmit();
      }
    }
  };

  // Determine state borders and background colors matching LearnInput
  let inputBorderClass = "focus-visible:ring-1 focus-visible:ring-indigo-500 border-border bg-card";
  if (isSubmitted) {
    if (answerState === "correct") {
      inputBorderClass = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 cursor-default";
    } else if (answerState === "near") {
      inputBorderClass = "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 cursor-default";
    } else if (answerState === "unknown") {
      inputBorderClass = "bg-zinc-500/10 border-zinc-400 text-zinc-600 dark:text-zinc-400 cursor-default";
    } else {
      inputBorderClass = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 cursor-default";
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 select-none">
      <div className="relative py-6 sm:py-8 px-4 border border-border/80 rounded-2xl bg-card shadow-xs">
        <div className="text-center flex flex-col items-center justify-center gap-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Nghe và viết lại từ
          </p>
          {onSpeakPrompt && (
            <button
              onClick={onSpeakPrompt}
              className="h-14 w-14 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              title="Nghe phát âm"
            >
              <Volume2 className="h-6 w-6 animate-pulse" />
            </button>
          )}
          <span className="text-xs font-bold text-muted-foreground">
            Bấm nút để nghe lại (Ctrl)
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          ref={inputRef}
          type="text"
          disabled={isSubmitted}
          placeholder="Nhập từ bạn nghe được..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-xl h-12 text-sm px-4 font-medium transition-all duration-300",
            inputBorderClass
          )}
        />

        {!isSubmitted && (
          <div className="flex gap-2">
            {onSkip && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="rounded-xl h-11 px-4 text-xs font-bold border-border/80 hover:bg-muted shrink-0 cursor-pointer"
              >
                Không biết
              </Button>
            )}
            <Button
              disabled={!inputValue.trim()}
              onClick={onSubmit}
              className="rounded-xl h-11 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer select-none"
            >
              Kiểm tra đáp án (Enter)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
