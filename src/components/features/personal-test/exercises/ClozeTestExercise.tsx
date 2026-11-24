"use client";

import React, { useState, useMemo } from "react";
import { ClozeTestExercise as ClozeTestType, TestMode } from "@/types/vocabee-test";
import { parseClozePassage } from "@/lib/personal-test/vocabee-test-parser";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClozeTestExerciseProps {
  exercise: ClozeTestType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
}

export function ClozeTestExercise({
  exercise,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
}: ClozeTestExerciseProps) {
  const [activeBlankId, setActiveBlankId] = useState<number | null>(
    exercise.answers[0]?.id ?? null
  );

  const segments = useMemo(() => {
    return parseClozePassage(exercise.passage);
  }, [exercise.passage]);

  const handleWordBankClick = (word: string) => {
    if (isChecked && mode === "practice") return;

    if (activeBlankId !== null) {
      const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", activeBlankId);
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
            Nhấn vào từ để điền vào ô trống đang chọn
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

      {/* Natural Passage Container */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Đoạn văn đọc hiểu (Reading Passage)</span>
        </div>

        {/* Natural text flow rendering */}
        <div className="text-base sm:text-lg leading-loose sm:leading-loose text-foreground font-normal">
          {segments.map((segment, idx) => {
            if (segment.type === "text") {
              return <span key={idx}>{segment.value}</span>;
            }

            // Blank replacement
            const blankId = segment.blankId!;
            const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", blankId);
            const answerObj = exercise.answers.find((a) => a.id === blankId);
            const currentAnswer = userAnswers[qKey] || "";
            const isSelected = activeBlankId === blankId;
            const isCorrect = isChecked && answerObj
              ? checkSingleAnswer("cloze_test", currentAnswer, answerObj.answer)
              : null;

            return (
              <span
                key={idx}
                onClick={() => setActiveBlankId(blankId)}
                className="inline-flex items-center mx-1.5 align-baseline"
              >
                <span className="text-xs font-bold text-muted-foreground mr-1 select-none">
                  ({blankId})
                </span>
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => onAnswerChange(qKey, e.target.value)}
                  onFocus={() => setActiveBlankId(blankId)}
                  disabled={isChecked && mode === "practice"}
                  placeholder="[ ______ ]"
                  className={cn(
                    "h-8 sm:h-9 w-32 sm:w-38 text-center font-semibold text-xs sm:text-sm rounded-lg border-2 inline-block transition-all",
                    isSelected
                      ? "ring-2 ring-primary/40 border-primary"
                      : "border-border/80 hover:border-primary/50",
                    isChecked
                      ? isCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "border-destructive bg-destructive/10 text-destructive line-through"
                      : "bg-background"
                  )}
                />
              </span>
            );
          })}
        </div>
      </div>

      {/* Explanations List for Cloze Blanks */}
      {isChecked && (
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Đáp án & Giải thích chi tiết từng ô trống</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {exercise.answers.map((ans) => {
              const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", ans.id);
              const userAns = userAnswers[qKey] || "";
              const isCorrect = checkSingleAnswer("cloze_test", userAns, ans.answer);

              return (
                <div
                  key={ans.id}
                  className={cn(
                    "rounded-xl border p-3.5 space-y-2 bg-card text-xs",
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      Ô trống ({ans.id})
                    </span>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Chính xác</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive font-semibold text-[11px]">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Chưa đúng</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
                    <div className="text-muted-foreground">
                      Bạn điền: <strong className={isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>{userAns || "(trống)"}</strong>
                    </div>
                    {!isCorrect && (
                      <div className="text-muted-foreground">
                        • Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400">{ans.answer}</strong>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground bg-muted/40 p-2 rounded-lg leading-relaxed">
                    {ans.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
