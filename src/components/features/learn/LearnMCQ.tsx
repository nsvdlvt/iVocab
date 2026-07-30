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
    <div className="w-full max-w-xl mx-auto space-y-4 select-none">
      <div className="relative py-6 sm:py-8 px-4 border border-border/80 rounded-2xl bg-card shadow-xs">
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {question.direction === "en-vi" && onSpeakPrompt && (
              <button
                type="button"
                onClick={onSpeakPrompt}
                className="h-8 w-8 rounded-lg bg-transparent text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 inline-flex items-center justify-center"
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

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-transparent text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 inline-flex items-center justify-center"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onToggleStar && (
              <button
                type="button"
                onClick={onToggleStar}
                className={[
                  "h-8 w-8 rounded-lg bg-transparent transition-all hover:bg-slate-100 inline-flex items-center justify-center",
                  isStarred
                    ? "text-amber-500 hover:text-amber-500"
                    : "text-slate-500 hover:text-amber-500",
                ].join(" ")}
                title={isStarred ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích"}
              >
                <Star className={["h-4 w-4", isStarred ? "fill-amber-400 text-amber-500" : ""].join(" ")} />
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Câu hỏi Trắc nghiệm
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug px-2 line-clamp-3">
            {question.prompt}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const isWrongSelected = isSelected && !isCorrectOption;

          let btnClass = "border-border bg-card hover:bg-muted/50 cursor-pointer";
          let badgeClass = "bg-muted/70 text-muted-foreground border-border";

          if (isSubmitted) {
            if (isCorrectOption) {
              btnClass =
                "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 cursor-default";
              badgeClass = "bg-emerald-500 text-white border-emerald-500";
            } else if (isWrongSelected) {
              btnClass =
                "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 cursor-default";
              badgeClass = "bg-rose-500 text-white border-rose-500";
            } else {
              btnClass = "bg-muted/30 border-border/40 text-muted-foreground/40 cursor-default";
              badgeClass = "bg-muted/30 text-muted-foreground/30 border-border/20";
            }
          } else if (isSelected) {
            btnClass =
              "border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer";
            badgeClass = "bg-indigo-500 text-white border-indigo-500";
          }

          return (
            <button
              key={option.id}
              disabled={isSubmitted}
              onClick={() => onSelectOption(option.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border font-semibold text-sm outline-none flex items-center justify-between transition-all duration-300 ease-in-out",
                btnClass
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full border text-[11px] font-bold shrink-0 font-mono transition-colors duration-300",
                    badgeClass
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{option.text}</span>
              </div>

              {isSubmitted && (isCorrectOption || isWrongSelected) && (
                <div className="shrink-0 ml-2 animate-in fade-in duration-200">
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
        <div className="pt-2 flex justify-center">
          <button
            onClick={onSkip}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
          >
            Không biết (5)
          </button>
        </div>
      )}
    </div>
  );
}
