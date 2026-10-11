"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LearnQuestion, AnswerState } from "@/lib/learning/question-types";
import { Check, Pencil, Star, Volume2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LearnMCQProps {
  question: LearnQuestion;
  selectedOptionId: string | null;
  answerState: AnswerState;
  onSelectOption: (optionId: string) => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onToggleStar?: () => void;
  isStarred?: boolean;
  autoPlayQuestionAudio?: boolean;
  onToggleAutoPlayQuestion?: () => void;
  onSpeakPrompt?: () => void;
}

export function LearnMCQ({
  question,
  selectedOptionId,
  answerState,
  onSelectOption,
  onSkip,
  onEdit,
  onToggleStar,
  isStarred,
  autoPlayQuestionAudio,
  onToggleAutoPlayQuestion,
  onSpeakPrompt,
}: LearnMCQProps) {
  const isSubmitted = answerState !== "unanswered";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2.5 sm:space-y-4 select-none">
      <div className="relative py-4 sm:py-9 px-3.5 sm:px-6 border border-border/80 rounded-2xl bg-card shadow-xs">
        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {question.direction === "en-vi" && onSpeakPrompt && (
              <button
                type="button"
                onClick={onSpeakPrompt}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground inline-flex items-center justify-center cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
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
              <button
                type="button"
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground inline-flex items-center justify-center cursor-pointer"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onToggleStar && (
              <button
                type="button"
                onClick={onToggleStar}
                className={cn(
                  "h-8 w-8 rounded-lg bg-transparent transition-colors hover:bg-muted inline-flex items-center justify-center cursor-pointer",
                  isStarred
                    ? "text-amber-500 hover:text-amber-500"
                    : "text-muted-foreground hover:text-amber-500"
                )}
                title={isStarred ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích"}
              >
                <Star className={cn("h-4 w-4", isStarred && "fill-amber-400 text-amber-500")} />
              </button>
            )}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Chọn đáp án đúng ({question.direction === "en-vi" ? "Anh → Việt" : "Việt → Anh"})
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug px-2 line-clamp-3 select-text">
            {question.prompt}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const isWrongSelected = isSelected && !isCorrectOption;

          let btnClass =
            "border-2 border-b-[4px] border-border/90 bg-card hover:border-primary/50 hover:bg-primary/[0.03] active:translate-y-[2px] active:border-b-2 cursor-pointer text-foreground shadow-2xs";
          let kbdClass = "bg-muted/80 text-muted-foreground border-border";

          if (isSubmitted) {
            if (isCorrectOption) {
              btnClass =
                "border-2 border-b-[4px] border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 cursor-default ring-1 ring-emerald-500/30";
              kbdClass = "bg-emerald-500 text-white border-emerald-500 shadow-none";
            } else if (isWrongSelected) {
              btnClass =
                "border-2 border-b-[4px] border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200 cursor-default ring-1 ring-rose-500/30";
              kbdClass = "bg-rose-500 text-white border-rose-500 shadow-none";
            } else {
              btnClass = "border-2 border-b-2 border-border/40 bg-muted/20 text-muted-foreground/50 cursor-default opacity-50";
              kbdClass = "bg-muted/30 text-muted-foreground/40 border-border/30 shadow-none";
            }
          } else if (isSelected) {
            btnClass =
              "border-2 border-b-[4px] border-primary bg-primary/[0.08] text-primary hover:bg-primary/10 cursor-pointer ring-1 ring-primary/20";
            kbdClass = "bg-primary text-primary-foreground border-primary shadow-none";
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectOption(option.id)}
              className={cn(
                "w-full text-left min-h-[46px] p-2.5 sm:p-4 rounded-xl border font-medium text-xs sm:text-sm outline-none flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-150",
                btnClass
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <kbd
                  className={cn(
                    "h-6 w-6 rounded-md text-xs font-bold shrink-0 transition-colors",
                    kbdClass
                  )}
                >
                  {idx + 1}
                </kbd>
                <span className="leading-snug break-words">{option.text}</span>
              </div>

              {isSubmitted && (isCorrectOption || isWrongSelected) && (
                <div className="shrink-0 animate-in fade-in duration-150">
                  {isCorrectOption ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!isSubmitted && onSkip && (
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-muted/60"
          >
            <span>Không biết</span>
            <kbd>5</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
