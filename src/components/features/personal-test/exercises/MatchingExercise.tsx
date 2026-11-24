"use client";

import React, { useState, useMemo } from "react";
import { MatchingExercise as MatchingExerciseType, TestMode } from "@/types/vocabee-test";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchingExerciseProps {
  exercise: MatchingExerciseType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
}

// Fisher-Yates deterministic-safe shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MatchingExercise({
  exercise,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
}: MatchingExerciseProps) {
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // Shuffled definitions list (shuffled once per exercise session)
  const shuffledDefinitions = useMemo(() => {
    return shuffleArray(
      exercise.items.map((item) => ({
        id: item.id,
        definition: item.definition,
      }))
    );
  }, [exercise]);

  // Handle matching interaction
  const handleWordClick = (wordId: number) => {
    if (isChecked && mode === "practice") return;

    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    } else {
      setSelectedWordId(wordId);
    }
  };

  const handleDefinitionClick = (definitionText: string) => {
    if (isChecked && mode === "practice") return;

    if (selectedWordId !== null) {
      const qKey = getQuestionKey(setIndex, exerciseIndex, "matching", selectedWordId);
      // If clicked definition is already assigned to this word, unassign
      if (userAnswers[qKey] === definitionText) {
        onAnswerChange(qKey, "");
      } else {
        // If definition is assigned to another word, unassign from that word
        exercise.items.forEach((item) => {
          const otherKey = getQuestionKey(setIndex, exerciseIndex, "matching", item.id);
          if (userAnswers[otherKey] === definitionText) {
            onAnswerChange(otherKey, "");
          }
        });
        onAnswerChange(qKey, definitionText);
      }
      setSelectedWordId(null);
    }
  };

  const handleUnpair = (wordId: number) => {
    if (isChecked && mode === "practice") return;
    const qKey = getQuestionKey(setIndex, exerciseIndex, "matching", wordId);
    onAnswerChange(qKey, "");
  };

  return (
    <div className="space-y-6">
      {/* Exercise Instructions */}
      <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Hướng dẫn:</strong> Nhấn chọn một từ ở cột trái, sau đó nhấn chọn định nghĩa phù hợp ở cột phải để ghép cặp.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[11px] shrink-0">
          {exercise.items.length} cặp từ
        </Badge>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Words */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Từ vựng (Vocabulary)
          </div>
          <div className="space-y-2.5">
            {exercise.items.map((item) => {
              const qKey = getQuestionKey(setIndex, exerciseIndex, "matching", item.id);
              const matchedDefinition = userAnswers[qKey];
              const isSelected = selectedWordId === item.id;
              const hasMatch = !!matchedDefinition;
              const isCorrect = isChecked
                ? checkSingleAnswer("matching", matchedDefinition, item.definition)
                : null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition-all cursor-pointer relative",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                      : isChecked
                      ? isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-destructive/40 bg-destructive/5"
                      : hasMatch
                      ? "border-primary/40 bg-card"
                      : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30"
                  )}
                  onClick={() => handleWordClick(item.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground">{item.word}</span>

                    {isChecked ? (
                      isCorrect ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đúng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-destructive font-semibold text-xs">
                          <XCircle className="h-4 w-4" />
                          <span>Sai</span>
                        </div>
                      )
                    ) : hasMatch ? (
                      <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                        Đã ghép
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Chọn để ghép</span>
                    )}
                  </div>

                  {/* Render paired definition preview */}
                  {matchedDefinition && (
                    <div className="mt-2 pt-2 border-t border-border/60 flex items-start justify-between gap-2 text-xs">
                      <span className="text-muted-foreground line-clamp-2 italic">
                        &quot;{matchedDefinition}&quot;
                      </span>
                      {!isChecked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpair(item.id);
                          }}
                          className="text-[11px] text-muted-foreground hover:text-destructive shrink-0 cursor-pointer font-medium underline"
                        >
                          Hủy ghép
                        </button>
                      )}
                    </div>
                  )}

                  {/* Immediate Explanation in Practice Mode */}
                  {isChecked && (
                    <div className="mt-3 pt-2.5 border-t border-border/80 space-y-1.5 text-xs">
                      {!isCorrect && (
                        <div className="text-muted-foreground">
                          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Đáp án đúng:{" "}
                          </strong>
                          <span>{item.definition}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5 text-foreground/80 bg-muted/40 p-2 rounded-lg">
                        <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Definitions */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Định nghĩa (Definitions)
          </div>
          <div className="space-y-2.5">
            {shuffledDefinitions.map((def, idx) => {
              // Find which word (if any) currently matched this definition
              const matchedWordItem = exercise.items.find((item) => {
                const qKey = getQuestionKey(setIndex, exerciseIndex, "matching", item.id);
                return userAnswers[qKey] === def.definition;
              });

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-3.5 transition-all cursor-pointer text-xs leading-relaxed",
                    matchedWordItem
                      ? "border-primary/40 bg-primary/5 text-foreground font-medium"
                      : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleDefinitionClick(def.definition)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{def.definition}</span>
                    {matchedWordItem && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-semibold">
                        {matchedWordItem.word}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
