"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LearnQuestion, AnswerState } from "@/lib/learning/question-types";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LearnInputProps {
  question: LearnQuestion;
  inputValue: string;
  answerState: AnswerState;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  // Audio configuration switches
  autoPlayQuestionAudio?: boolean;
  onToggleAutoPlayQuestion?: () => void;
  onSpeakPrompt?: () => void;
}

export function LearnInput({
  question,
  inputValue,
  answerState,
  onInputChange,
  onSubmit,
  onContinue,
  onSkip,
  autoPlayQuestionAudio,
  onToggleAutoPlayQuestion,
  onSpeakPrompt,
}: LearnInputProps) {
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

  // Determine state borders and background colors
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
        {/* Optional EN prompt speaker trigger */}
        {question.direction === "en-vi" && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {onSpeakPrompt && (
              <button
                onClick={onSpeakPrompt}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-500/10 cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
            {onToggleAutoPlayQuestion && (
              <div className="flex items-center ml-1" title="Tự động phát âm thanh">
                <Switch
                  checked={!!autoPlayQuestionAudio}
                  onChange={onToggleAutoPlayQuestion}
                  ariaLabel="Tự động phát âm thanh"
                />
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Tự viết đáp án
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug px-2 line-clamp-3">
            {question.prompt}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          ref={inputRef}
          type="text"
          readOnly={isSubmitted}
          placeholder="Nhập câu trả lời..."
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
