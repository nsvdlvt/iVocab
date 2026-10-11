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
  onContinue: () => void;
  onSkip?: () => void;
  onSpeakPrompt?: () => void;
}

export function WordDictation({
  question,
  inputValue,
  answerState,
  onInputChange,
  onSubmit,
  onContinue,
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
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitted) {
      onContinue();
      return;
    }

    if (inputValue.trim()) {
      onSubmit();
    }
  };

  // Determine state borders and background colors matching LearnInput
  let inputBorderClass = "focus-visible:ring-1 focus-visible:ring-primary border-border/80 bg-card";
  if (isSubmitted) {
    if (answerState === "correct") {
      inputBorderClass = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 cursor-default";
    } else if (answerState === "near") {
      inputBorderClass = "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 cursor-default";
    } else if (answerState === "unknown") {
      inputBorderClass = "bg-muted/50 border-border text-muted-foreground cursor-default";
    } else {
      inputBorderClass = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 cursor-default";
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none">
      <div className="relative py-8 sm:py-10 px-6 border border-border/80 rounded-2xl bg-card shadow-xs">
        <div className="text-center flex flex-col items-center justify-center gap-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Nghe và viết lại từ vựng
          </p>
          {onSpeakPrompt && (
            <button
              type="button"
              onClick={onSpeakPrompt}
              className="group h-16 w-16 rounded-2xl flex items-center justify-center bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 cursor-pointer transition-all duration-200 shadow-xs active:scale-95"
              title="Nghe phát âm (Ctrl)"
            >
              <Volume2 className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>Bấm nút hoặc phím</span>
            <kbd>Ctrl</kbd>
            <span>để nghe lại</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          ref={inputRef}
          type="text"
          readOnly={isSubmitted}
          placeholder="Nhập từ bạn nghe được..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-xl h-12 text-base px-4 font-medium transition-all duration-200",
            inputBorderClass
          )}
        />

        {!isSubmitted && (
          <div className="flex gap-2.5">
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="rounded-xl h-11 px-4 text-xs font-semibold border-border/80 hover:bg-muted shrink-0 cursor-pointer gap-1.5"
              >
                <span>Không biết</span>
                <kbd>Ctrl+I</kbd>
              </Button>
            )}
            <Button
              type="button"
              disabled={!inputValue.trim()}
              onClick={onSubmit}
              className="rounded-xl h-11 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm cursor-pointer select-none gap-2"
            >
              <span>Kiểm tra đáp án</span>
              <kbd className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground shadow-none">
                Enter
              </kbd>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
