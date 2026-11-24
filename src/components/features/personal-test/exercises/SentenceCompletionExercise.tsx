"use client";

import React, { useState } from "react";
import { SentenceCompletionExercise as SentenceCompletionType, TestMode } from "@/types/vocabee-test";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, HelpCircle, Sparkles, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentenceCompletionExerciseProps {
  exercise: SentenceCompletionType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
}

export function SentenceCompletionExercise({
  exercise,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
}: SentenceCompletionExerciseProps) {
  const [activeItemId, setActiveItemId] = useState<number | null>(
    exercise.items[0]?.id ?? null
  );

  const handleWordBankClick = (word: string) => {
    if (isChecked && mode === "practice") return;

    if (activeItemId !== null) {
      const qKey = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", activeItemId);
      onAnswerChange(qKey, word);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exercise Instructions & Word Bank Header */}
      <div className="rounded-2xl border border-primary/20 bg-muted/20 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Ngân hàng từ vựng (Word Bank)</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Nhấn vào từ để điền vào câu đang chọn
          </span>
        </div>

        {/* Word Bank Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {exercise.word_bank.map((word, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleWordBankClick(word)}
              disabled={isChecked && mode === "practice"}
              className="rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shadow-2xs active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Sentence Items List */}
      <div className="space-y-4">
        {exercise.items.map((item, index) => {
          const qKey = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", item.id);
          const currentAnswer = userAnswers[qKey] || "";
          const isSelected = activeItemId === item.id;
          const isCorrect = isChecked
            ? checkSingleAnswer("sentence_completion", currentAnswer, item.answer)
            : null;

          // Split sentence at '___'
          const parts = item.sentence.split(/_{3,}/);
          const prefix = parts[0] || "";
          const suffix = parts.slice(1).join(" ") || "";

          return (
            <div
              key={item.id}
              onClick={() => setActiveItemId(item.id)}
              className={cn(
                "rounded-2xl border p-4 sm:p-5 transition-all space-y-3",
                isSelected
                  ? "border-primary/50 bg-card shadow-xs ring-1 ring-primary/30"
                  : isChecked
                  ? isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-destructive/40 bg-destructive/5"
                  : "border-border/80 bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">
                  Câu hỏi {index + 1} / {exercise.items.length}
                </span>

                {isChecked && (
                  <div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Chính xác</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive font-semibold text-xs">
                        <XCircle className="h-4 w-4" />
                        <span>Chưa đúng</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Natural Sentence Flow with Inline Input */}
              <div className="text-sm sm:text-base leading-loose text-foreground">
                <span>{prefix}</span>
                <span className="inline-block mx-2 align-middle">
                  <Input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => onAnswerChange(qKey, e.target.value)}
                    onFocus={() => setActiveItemId(item.id)}
                    disabled={isChecked && mode === "practice"}
                    placeholder="điền từ..."
                    className={cn(
                      "h-8 sm:h-9 w-36 sm:w-44 text-center font-semibold text-xs sm:text-sm rounded-lg border-2 inline-block",
                      isChecked
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-destructive bg-destructive/10 text-destructive line-through"
                        : "border-primary/40 focus:border-primary bg-background"
                    )}
                  />
                </span>
                <span>{suffix}</span>
              </div>

              {/* Explanation Section */}
              {isChecked && (
                <div className="pt-3 border-t border-border/70 space-y-2 text-xs">
                  {!isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Đáp án đúng:</span>
                      <Badge className="bg-emerald-600 text-white font-mono text-xs">
                        {item.answer}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Giải thích: </strong>
                      <span className="text-muted-foreground">{item.explanation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
