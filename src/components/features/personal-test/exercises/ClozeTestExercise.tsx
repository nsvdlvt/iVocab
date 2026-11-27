"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ClozeTestExercise as ClozeTestType, TestMode } from "@/types/vocabee-test";
import { parseClozePassage } from "@/lib/personal-test/vocabee-test-parser";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { CheckCircle2, XCircle, HelpCircle, BookOpen, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WordBankBar } from "./WordBankBar";

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
  const [focusedBlankId, setFocusedBlankId] = useState<number | null>(null);
  const [selectedBankWord, setSelectedBankWord] = useState<string | null>(null);
  const [hoveredBlankId, setHoveredBlankId] = useState<number | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const isLocked = isChecked && mode === "practice";

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ blankId: number | null }>).detail;
      setHoveredBlankId(detail?.blankId ?? null);
    };
    window.addEventListener("vocabee-blank-hover", handler);
    return () => window.removeEventListener("vocabee-blank-hover", handler);
  }, []);

  const segments = useMemo(() => {
    return parseClozePassage(exercise.passage);
  }, [exercise.passage]);

  const fillBlank = (blankId: number, word: string) => {
    if (isLocked) return;
    const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", blankId);
    onAnswerChange(qKey, word);
    setFocusedBlankId(blankId);
    setTimeout(() => {
      inputRefs.current.get(blankId)?.focus();
    }, 0);
  };

  const handleSelectBankWord = (word: string | null) => {
    if (isLocked) return;
    if (word && focusedBlankId !== null && selectedBankWord === null) {
      fillBlank(focusedBlankId, word);
      return;
    }
    setSelectedBankWord(word);
  };

  const usedAnswers = exercise.answers.map((ans) => {
    const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", ans.id);
    return userAnswers[qKey] || "";
  });

  return (
    <div className="space-y-5">
      {/* Sticky Word Bank */}
      <WordBankBar
        wordBank={exercise.word_bank}
        usedAnswers={usedAnswers}
        selectedWord={selectedBankWord}
        onSelectWord={handleSelectBankWord}
        onDropWordOnBlank={(blankId, word) => fillBlank(blankId, word)}
        disabled={isLocked}
        helperText="Kéo thả hoặc chạm từ rồi nhấn vào ô trống trong đoạn văn"
      />

      {/* Grammar Transformation Tip */}
      <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/25 px-3.5 py-2.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Lưu ý ngữ pháp:</strong> Một số ô trống yêu cầu chia động từ, số ít/nhiều hoặc biến đổi từ loại dựa theo ngữ cảnh đoạn văn.
        </span>
      </div>

      {/* Passage Container */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Đoạn văn đọc hiểu (Reading Passage)</span>
          </div>
          {selectedBankWord && !isLocked && (
            <span className="text-[11px] font-medium text-primary">
              Nhấn vào ô trống để điền &ldquo;{selectedBankWord}&rdquo;
            </span>
          )}
        </div>

        <div className="text-base sm:text-lg leading-loose sm:leading-loose text-foreground font-normal select-text cursor-text">
          {segments.map((segment, idx) => {
            if (segment.type === "text") {
              return (
                <span key={idx} className="select-text cursor-text">
                  {segment.value}
                </span>
              );
            }

            const blankId = segment.blankId!;
            const qKey = getQuestionKey(setIndex, exerciseIndex, "cloze_test", blankId);
            const answerObj = exercise.answers.find((a) => a.id === blankId);
            const currentAnswer = userAnswers[qKey] || "";
            const isSelected = focusedBlankId === blankId;
            const isDropHovered = hoveredBlankId === blankId;
            const isCorrect =
              isChecked && answerObj
                ? checkSingleAnswer("cloze_test", currentAnswer, answerObj.answer)
                : null;

            return (
              <span
                key={idx}
                data-blank-drop-id={blankId}
                onClick={() => {
                  if (isLocked) return;
                  if (selectedBankWord) {
                    fillBlank(blankId, selectedBankWord);
                    setSelectedBankWord(null);
                  } else {
                    setFocusedBlankId(blankId);
                    inputRefs.current.get(blankId)?.focus();
                  }
                }}
                className="inline-flex items-center gap-1 mx-1.5 align-baseline"
              >
                <span className="text-xs font-bold text-muted-foreground select-none">
                  ({blankId})
                </span>
                <input
                  ref={(el) => {
                    if (el) inputRefs.current.set(blankId, el);
                    else inputRefs.current.delete(blankId);
                  }}
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => onAnswerChange(qKey, e.target.value)}
                  onFocus={() => setFocusedBlankId(blankId)}
                  onBlur={() => {
                    setTimeout(() => {
                      setFocusedBlankId((prev) => (prev === blankId ? null : prev));
                    }, 150);
                  }}
                  disabled={isLocked}
                  placeholder="[ ______ ]"
                  className={cn(
                    "h-8 sm:h-9 w-36 sm:w-44 text-center font-semibold text-xs sm:text-sm rounded-lg border-2 inline-block transition-all",
                    isDropHovered
                      ? "ring-2 ring-primary/50 border-primary bg-primary/15"
                      : isSelected
                      ? "ring-2 ring-primary/40 border-primary"
                      : "border-border/80 hover:border-primary/50",
                    isChecked
                      ? isCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "border-destructive bg-destructive/10 text-destructive line-through"
                      : "bg-background"
                  )}
                />
                {currentAnswer && !isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswerChange(qKey, "");
                    }}
                    aria-label={`Xóa ô trống ${blankId}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
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
                      Bạn điền:{" "}
                      <strong
                        className={
                          isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        }
                      >
                        {userAns || "(trống)"}
                      </strong>
                    </div>
                    {!isCorrect && (
                      <div className="text-muted-foreground">
                        <span className="mx-1 text-border">|</span>
                        Đáp án đúng:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {ans.answer}
                        </strong>
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
