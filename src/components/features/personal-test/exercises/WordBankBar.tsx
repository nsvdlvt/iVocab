"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Check, GripVertical, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resolveAnswerToTargetWord } from "@/lib/personal-test/vocabee-test-validator";

interface WordBankBarProps {
  wordBank: string[];
  usedAnswers: string[];
  selectedWord: string | null;
  onSelectWord: (word: string | null) => void;
  onDropWordOnBlank: (blankId: number, word: string) => void;
  disabled?: boolean;
  helperText: string;
}

interface WordDragState {
  word: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoveredBlankId: number | null;
}

export function WordBankBar({
  wordBank,
  usedAnswers,
  selectedWord,
  onSelectWord,
  onDropWordOnBlank,
  disabled = false,
  helperText,
}: WordBankBarProps) {
  const [dragState, setDragState] = useState<WordDragState | null>(null);
  const dragRef = useRef<WordDragState | null>(null);

  // Determine which base words in wordBank have already been used (including inflected forms)
  const usedBaseWords = useMemo(() => {
    const used = new Set<string>();
    for (const ans of usedAnswers) {
      const trimmed = ans?.trim();
      if (!trimmed) continue;
      const matched = resolveAnswerToTargetWord(trimmed, wordBank);
      if (matched) {
        used.add(matched.toLowerCase());
      } else {
        used.add(trimmed.toLowerCase());
      }
    }
    return used;
  }, [usedAnswers, wordBank]);

  const findBlankAtPoint = (clientX: number, clientY: number): number | null => {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const attr = (el as HTMLElement).getAttribute?.("data-blank-drop-id");
      if (attr) {
        const parsed = Number(attr);
        if (Number.isInteger(parsed)) return parsed;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      const prev = dragRef.current;
      if (!prev) return;
      const dist = Math.hypot(e.clientX - prev.startX, e.clientY - prev.startY);
      const isDragging = prev.isDragging || dist >= 6;
      const hoveredBlankId = isDragging
        ? findBlankAtPoint(e.clientX, e.clientY)
        : null;

      // Dispatch highlight attribute cleanly via custom event so blanks can glow
      if (hoveredBlankId !== prev.hoveredBlankId) {
        window.dispatchEvent(
          new CustomEvent("vocabee-blank-hover", { detail: { blankId: hoveredBlankId } })
        );
      }

      const next: WordDragState = {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging,
        hoveredBlankId,
      };
      dragRef.current = next;
      setDragState(next);
    };

    const handleUp = (e: PointerEvent) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDragState(null);
      window.dispatchEvent(
        new CustomEvent("vocabee-blank-hover", { detail: { blankId: null } })
      );

      if (!current) return;

      if (current.isDragging) {
        const blankId = findBlankAtPoint(e.clientX, e.clientY);
        if (blankId !== null) {
          onDropWordOnBlank(blankId, current.word);
          onSelectWord(null);
        }
      } else {
        // Click / tap: toggle or select word
        onSelectWord(selectedWord === current.word ? null : current.word);
      }
    };

    const handleCancel = () => {
      dragRef.current = null;
      setDragState(null);
      window.dispatchEvent(
        new CustomEvent("vocabee-blank-hover", { detail: { blankId: null } })
      );
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    };
  });

  const handlePointerDown = (e: React.PointerEvent, word: string) => {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Prevent stealing focus from an actively typed input on simple click unless dragging
    const initial: WordDragState = {
      word,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoveredBlankId: null,
    };
    dragRef.current = initial;
    setDragState(initial);
  };

  return (
    <>
      <div
        className="sticky z-10 rounded-2xl border border-primary/25 bg-background/95 backdrop-blur-md p-3.5 sm:p-4 space-y-2.5 shadow-sm"
        style={{ top: "calc(var(--test-progress-offset, 118px) + 8px)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>Ngân hàng từ vựng (Word Bank)</span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {usedBaseWords.size}/{wordBank.length} đã dùng
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{helperText}</span>
        </div>

        {/* Selected word status indicator */}
        {selectedWord && !disabled && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-medium text-primary">
            <span>
              Đang chọn: <strong className="font-bold">{selectedWord}</strong> — nhấn vào ô trống để điền (nhớ chia đúng dạng từ nếu cần)
            </span>
            <button
              type="button"
              onClick={() => onSelectWord(null)}
              aria-label="Bỏ chọn từ"
              className="hover:text-foreground cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Word chips: wrap cleanly with bounded height to avoid covering content */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-h-28 sm:max-h-36 overflow-y-auto pt-0.5 select-none">
          {wordBank.map((word, idx) => {
            const isUsed = usedBaseWords.has(word.toLowerCase());
            const isSelected = selectedWord === word;
            const isDraggingThis =
              dragState?.isDragging && dragState.word === word;

            return (
              <button
                key={`${word}-${idx}`}
                type="button"
                disabled={disabled}
                onPointerDown={(e) => {
                  // Prevent input blur before click/drag resolves
                  e.preventDefault();
                  handlePointerDown(e, word);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs disabled:pointer-events-none disabled:opacity-60",
                  !disabled && "cursor-grab active:cursor-grabbing touch-none",
                  isDraggingThis
                    ? "opacity-45 border-dashed border-primary"
                    : isSelected
                    ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : isUsed
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-primary"
                    : "border-border/80 bg-card text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                {!disabled && (
                  <GripVertical className="h-3 w-3 opacity-55 shrink-0" />
                )}
                <span>{word}</span>
                {isUsed && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating drag ghost */}
      {dragState?.isDragging && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 z-50 pointer-events-none"
          style={{
            transform: `translate3d(${dragState.currentX + 10}px, ${
              dragState.currentY - 20
            }px, 0)`,
          }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary bg-background/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-xl backdrop-blur-sm">
            <GripVertical className="h-3 w-3 text-primary" />
            <span>{dragState.word}</span>
          </div>
        </div>
      )}
    </>
  );
}
