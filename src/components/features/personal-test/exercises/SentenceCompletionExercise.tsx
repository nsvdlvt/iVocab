"use client";

import React, { useEffect, useRef, useState } from "react";
import { SentenceCompletionExercise as SentenceCompletionType, TestMode } from "@/types/vocabee-test";
import { getQuestionKey, checkSingleAnswer } from "@/lib/personal-test/vocabee-test-grader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, HelpCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WordBankBar } from "./WordBankBar";

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
  const [focusedItemId, setFocusedItemId] = useState<number | null>(null);
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

  const fillBlank = (itemId: number, word: string) => {
    if (isLocked) return;
    const qKey = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", itemId);
    onAnswerChange(qKey, word);
    setFocusedItemId(itemId);
    setTimeout(() => {
      inputRefs.current.get(itemId)?.focus();
    }, 0);
  };

  const handleSelectBankWord = (word: string | null) => {
    if (isLocked) return;
    // If an input is actively focused and user clicked a chip, fill it directly
    if (word && focusedItemId !== null && selectedBankWord === null) {
      fillBlank(focusedItemId, word);
      return;
    }
    setSelectedBankWord(word);
  };

  const handleBlankContainerClick = (
    itemId: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (isLocked) return;

    const selection = typeof window !== "undefined" ? window.getSelection() : null;
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    if (selectedBankWord) {
      fillBlank(itemId, selectedBankWord);
      setSelectedBankWord(null);
      return;
    }

    if (e.detail >= 2) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-selectable-sentence='true']")) {
      return;
    }

    setFocusedItemId(itemId);
    inputRefs.current.get(itemId)?.focus();
  };

  const usedAnswers = exercise.items.map((item) => {
    const qKey = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", item.id);
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
        helperText="Kéo thả hoặc chạm từ rồi nhấn ô trống (có thể sửa/chia dạng từ)"
      />

      {/* Grammar Transformation Tip */}
      <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/25 px-3.5 py-2.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Lưu ý ngữ pháp:</strong> Word Bank hiển thị dạng nguyên mẫu. Hãy kiểm tra thì, số ít/nhiều hoặc từ loại để điền dạng từ chính xác nhất (ví dụ: <em>exacerbate</em> → <em>exacerbated</em>).
        </span>
      </div>

      {/* Sentence Items List */}
      <div className="space-y-4">
        {exercise.items.map((item, index) => {
          const qKey = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", item.id);
          const currentAnswer = userAnswers[qKey] || "";
          const isFocused = focusedItemId === item.id;
          const isDropHovered = hoveredBlankId === item.id;
          const isCorrect = isChecked
            ? checkSingleAnswer("sentence_completion", currentAnswer, item.answer)
            : null;

          const parts = item.sentence.split(/_{3,}/);
          const prefix = parts[0] || "";
          const suffix = parts.slice(1).join(" ") || "";

          return (
            <div
              key={item.id}
              data-blank-drop-id={item.id}
              onClick={(e) => handleBlankContainerClick(item.id, e)}
              className={cn(
                "rounded-2xl border p-4 sm:p-5 transition-all space-y-3",
                !isLocked && selectedBankWord && "cursor-pointer",
                isDropHovered
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                  : isFocused
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

                <div className="flex items-center gap-2">
                  {isDropHovered && (
                    <Badge className="text-[10px] font-semibold">Thả từ vào đây</Badge>
                  )}
                  {!isDropHovered && selectedBankWord && !isLocked && (
                    <span className="text-[11px] font-medium text-primary">
                      Nhấn để điền &ldquo;{selectedBankWord}&rdquo;
                    </span>
                  )}
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
              </div>

              {/* Natural Sentence Flow with Inline Editable & Droppable Input */}
              <div
                data-selectable-sentence="true"
                className="text-sm sm:text-base leading-loose text-foreground select-text cursor-text"
              >
                <span className="select-text cursor-text">{prefix}</span>
                <span
                  data-blank-drop-id={item.id}
                  className="inline-flex items-center gap-1 mx-1.5 align-middle"
                >
                  <Input
                    ref={(el) => {
                      if (el) inputRefs.current.set(item.id, el);
                      else inputRefs.current.delete(item.id);
                    }}
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => onAnswerChange(qKey, e.target.value)}
                    onFocus={() => setFocusedItemId(item.id)}
                    onBlur={() => {
                      // Defer clearing focus so WordBank click can still read focusedItemId if needed
                      setTimeout(() => {
                        setFocusedItemId((prev) => (prev === item.id ? null : prev));
                      }, 150);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedBankWord && !isLocked) {
                        fillBlank(item.id, selectedBankWord);
                        setSelectedBankWord(null);
                      } else {
                        setFocusedItemId(item.id);
                      }
                    }}
                    disabled={isLocked}
                    placeholder="điền hoặc thả từ..."
                    className={cn(
                      "h-8 sm:h-9 w-40 sm:w-48 text-center font-semibold text-xs sm:text-sm rounded-lg border-2 inline-block",
                      isDropHovered && "border-primary bg-primary/15 ring-2 ring-primary/30",
                      isChecked
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-destructive bg-destructive/10 text-destructive line-through"
                        : "border-primary/40 focus:border-primary bg-background"
                    )}
                  />
                  {currentAnswer && !isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnswerChange(qKey, "");
                      }}
                      aria-label={`Xóa đáp án câu ${index + 1}`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
                <span className="select-text cursor-text">{suffix}</span>
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
