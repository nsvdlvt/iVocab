"use client";

import React, { useState, useMemo } from "react";
import { SynonymsMatchingExercise as SynonymsMatchingType, TestMode } from "@/types/vocabee-test";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SynonymsMatchingExerciseProps {
  exercise: SynonymsMatchingType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function SynonymsMatchingExercise({
  exercise,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
}: SynonymsMatchingExerciseProps) {
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // Shuffled synonym groups list
  const shuffledSynonymGroups = useMemo(() => {
    return shuffleArray(
      exercise.items.map((item) => ({
        id: item.id,
        synonymsText: item.synonyms.join(", "),
      }))
    );
  }, [exercise]);

  const handleWordClick = (wordId: number) => {
    if (isChecked && mode === "practice") return;

    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    } else {
      setSelectedWordId(wordId);
    }
  };

  const handleSynonymsClick = (synonymsText: string) => {
    if (isChecked && mode === "practice") return;

    if (selectedWordId !== null) {
      const qKey = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", selectedWordId);
      if (userAnswers[qKey] === synonymsText) {
        onAnswerChange(qKey, "");
      } else {
        // Disconnect if previously connected to another word
        exercise.items.forEach((item) => {
          const otherKey = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", item.id);
          if (userAnswers[otherKey] === synonymsText) {
            onAnswerChange(otherKey, "");
          }
        });
        onAnswerChange(qKey, synonymsText);
      }
      setSelectedWordId(null);
    }
  };

  const handleUnpair = (wordId: number) => {
    if (isChecked && mode === "practice") return;
    const qKey = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", wordId);
    onAnswerChange(qKey, "");
  };

  return (
    <div className="space-y-6">
      {/* Exercise Instructions */}
      <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Hướng dẫn:</strong> Chọn một từ vựng ở cột bên trái và ghép với nhóm từ đồng nghĩa tương ứng ở cột bên phải.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[11px] shrink-0">
          {exercise.items.length} nhóm từ
        </Badge>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Words */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Từ vựng gốc
          </div>
          <div className="space-y-2.5">
            {exercise.items.map((item) => {
              const qKey = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", item.id);
              const matchedSynonyms = userAnswers[qKey];
              const isSelected = selectedWordId === item.id;
              const hasMatch = !!matchedSynonyms;
              const isCorrect = isChecked
                ? checkSingleAnswer("synonyms_matching", matchedSynonyms, item.synonyms)
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

                  {/* Paired synonyms preview */}
                  {matchedSynonyms && (
                    <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span className="text-muted-foreground">≈</span>
                        <span>{matchedSynonyms}</span>
                      </div>
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

                  {/* Explanation in Practice Mode */}
                  {isChecked && (
                    <div className="mt-3 pt-2.5 border-t border-border/80 space-y-1.5 text-xs">
                      {!isCorrect && (
                        <div className="text-muted-foreground">
                          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Đáp án đúng:{" "}
                          </strong>
                          <span>{item.synonyms.join(", ")}</span>
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

        {/* Right Column: Synonym Groups */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Nhóm từ đồng nghĩa (Synonyms)
          </div>
          <div className="space-y-2.5">
            {shuffledSynonymGroups.map((grp, idx) => {
              const matchedWordItem = exercise.items.find((item) => {
                const qKey = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", item.id);
                return userAnswers[qKey] === grp.synonymsText;
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
                  onClick={() => handleSynonymsClick(grp.synonymsText)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{grp.synonymsText}</span>
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
