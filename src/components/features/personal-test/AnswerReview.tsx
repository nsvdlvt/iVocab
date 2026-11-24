"use client";

import React, { useState } from "react";
import { GradedQuestionResult, ExerciseType } from "@/types/vocabee-test";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerReviewProps {
  questionResults: GradedQuestionResult[];
}

const TYPE_BADGES: Record<ExerciseType, string> = {
  matching: "Matching",
  sentence_completion: "Sentence",
  synonyms_matching: "Synonyms",
  cloze_test: "Cloze",
};

export function AnswerReview({ questionResults }: AnswerReviewProps) {
  const [filter, setFilter] = useState<"all" | "incorrect" | "correct">("all");

  const filteredQuestions = questionResults.filter((q) => {
    if (filter === "incorrect") return !q.isCorrect;
    if (filter === "correct") return q.isCorrect;
    return true;
  });

  const incorrectCount = questionResults.filter((q) => !q.isCorrect).length;
  const correctCount = questionResults.filter((q) => q.isCorrect).length;

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>Chi tiết từng câu hỏi ({filteredQuestions.length})</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-md font-semibold transition-all cursor-pointer",
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả ({questionResults.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("incorrect")}
            className={cn(
              "px-3 py-1 rounded-md font-semibold transition-all cursor-pointer",
              filter === "incorrect"
                ? "bg-destructive text-destructive-foreground shadow-2xs"
                : "text-muted-foreground hover:text-destructive"
            )}
          >
            Câu sai ({incorrectCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter("correct")}
            className={cn(
              "px-3 py-1 rounded-md font-semibold transition-all cursor-pointer",
              filter === "correct"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-emerald-600"
            )}
          >
            Câu đúng ({correctCount})
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-muted/15 rounded-xl border border-dashed border-border">
            Không có câu hỏi nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.questionKey || idx}
              className={cn(
                "rounded-xl border p-4 space-y-3 transition-all",
                q.isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-destructive/30 bg-destructive/5"
              )}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {q.setLabel}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {TYPE_BADGES[q.exerciseType] || q.exerciseType}
                  </Badge>
                </div>

                {q.isCorrect ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Chính xác</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive font-bold text-xs">
                    <XCircle className="h-4 w-4" />
                    <span>Chưa đúng</span>
                  </span>
                )}
              </div>

              {/* Original Prompt */}
              <div className="text-sm font-semibold text-foreground leading-relaxed">
                {q.prompt}
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div className="rounded-lg bg-background/80 p-2.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Câu trả lời của bạn:</span>
                  <div
                    className={cn(
                      "font-semibold",
                      q.isCorrect
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive line-through"
                    )}
                  >
                    {q.userAnswer || "(Không trả lời)"}
                  </div>
                </div>

                <div className="rounded-lg bg-background/80 p-2.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Đáp án chính xác:</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {q.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
                <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Giải thích chi tiết: </strong>
                  <span className="text-muted-foreground">{q.explanation}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
