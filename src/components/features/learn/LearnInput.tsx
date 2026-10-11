"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LearnQuestion, AnswerState } from "@/lib/learning/question-types";
import { cn } from "@/lib/utils";
import { Pencil, Star, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LearnInputProps {
  question: LearnQuestion;
  inputValue: string;
  answerState: AnswerState;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onToggleStar?: () => void;
  isStarred?: boolean;
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
  onEdit,
  onToggleStar,
  isStarred,
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
        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {question.direction === "en-vi" && onSpeakPrompt && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSpeakPrompt}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
            {question.direction === "en-vi" && onToggleAutoPlayQuestion && (
              <div className="flex items-center" title="Tự động phát âm thanh">
                <Switch
                  checked={!!autoPlayQuestionAudio}
                  onChange={onToggleAutoPlayQuestion}
                  ariaLabel="Tự động phát âm thanh"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onToggleStar && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleStar}
                className={cn(
                  "h-8 w-8 rounded-lg bg-transparent transition-colors hover:bg-muted cursor-pointer",
                  isStarred
                    ? "text-amber-500 hover:text-amber-500"
                    : "text-muted-foreground hover:text-amber-500"
                )}
                title={isStarred ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích"}
              >
                <Star className={cn("h-4 w-4", isStarred && "fill-amber-400 text-amber-500")} />
              </Button>
            )}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Tự viết đáp án ({question.direction === "en-vi" ? "Anh → Việt" : "Việt → Anh"})
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug px-2 line-clamp-3 select-text">
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
                <kbd>5</kbd>
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
