"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  GripVertical,
  X,
  ArrowDownLeft,
  Replace,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EASING } from "@/lib/motion";
import { checkSingleAnswer, getQuestionKey } from "@/lib/personal-test/vocabee-test-grader";
import {
  computeAssignMatchUpdates,
  getAvailableMatchingTargets,
  type ShuffledMatchingTarget,
} from "@/lib/personal-test/matching-state";
import type { ExerciseType, TestMode } from "@/types/vocabee-test";

export interface MatchingBoardItem {
  id: number;
  word: string;
  targetValue: string; // canonical string stored in userAnswers & compared by grader
  displayTarget: string; // displayed text in the draggable/selectable definition card
  correctAnswerDisplay: string;
  correctCheckTarget: string | string[];
  explanation: string;
}

interface MatchingBoardProps {
  exerciseType: Extract<ExerciseType, "matching" | "synonyms_matching">;
  items: MatchingBoardItem[];
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
  instructionText: string;
  countLabel: string;
  leftColumnTitle: string;
  rightColumnTitle: string;
}

function shuffleArrayDeterministic<T>(array: T[], seedInput: number): T[] {
  const arr = [...array];
  let seed = (seedInput + 1) * 2654435761;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface DefinitionDragState {
  targetValue: string;
  displayTarget: string;
  sourceWordId: number | null; // null if dragged from available column, number if moved from a word card
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoveredWordId: number | null;
}

export function MatchingBoard({
  exerciseType,
  items,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
  instructionText,
  countLabel,
  leftColumnTitle,
  rightColumnTitle,
}: MatchingBoardProps) {
  const [selectedTargetValue, setSelectedTargetValue] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DefinitionDragState | null>(null);
  const dragStateRef = useRef<DefinitionDragState | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);

  const isLocked = isChecked && mode === "practice";

  // Deterministically shuffled definition/synonym cards
  const shuffledTargets: ShuffledMatchingTarget[] = useMemo(() => {
    const seed =
      setIndex * 113 +
      exerciseIndex * 37 +
      items.length * 7 +
      (exerciseType === "synonyms_matching" ? 19 : 3);
    return shuffleArrayDeterministic(
      items.map((item) => ({
        id: item.id,
        targetValue: item.targetValue,
        displayTarget: item.displayTarget,
      })),
      seed
    );
  }, [items, setIndex, exerciseIndex, exerciseType]);

  const availableTargets = useMemo(
    () =>
      getAvailableMatchingTargets({
        shuffledTargets,
        items,
        userAnswers,
        setIndex,
        exerciseIndex,
        exerciseType,
      }),
    [shuffledTargets, items, userAnswers, setIndex, exerciseIndex, exerciseType]
  );

  const matchedCount = items.length - availableTargets.length;

  const assignTargetToWord = (wordId: number, targetValue: string) => {
    if (isLocked) return;
    const updates = computeAssignMatchUpdates({
      wordId,
      targetValue,
      items,
      userAnswers,
      setIndex,
      exerciseIndex,
      exerciseType,
    });
    for (const u of updates) {
      onAnswerChange(u.questionKey, u.value);
    }
  };

  const handleUnpair = (wordId: number) => {
    if (isLocked) return;
    const qKey = getQuestionKey(setIndex, exerciseIndex, exerciseType, wordId);
    onAnswerChange(qKey, "");
  };

  const findWordDropTargetAtPoint = (
    clientX: number,
    clientY: number
  ): number | null => {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const attr = (el as HTMLElement).getAttribute?.("data-word-drop-id");
      if (attr !== null && attr !== undefined) {
        const parsed = Number(attr);
        if (Number.isInteger(parsed)) return parsed;
      }
    }
    return null;
  };

  const startDefinitionDrag = (
    e: React.PointerEvent,
    targetValue: string,
    displayTarget: string,
    sourceWordId: number | null = null
  ) => {
    lastPointerTypeRef.current = e.pointerType;
    if (isLocked) return;
    // On desktop mouse, allow drag-and-drop (and < 6px click fallback).
    // On touch devices, prioritize clean tap-to-match without blocking vertical scrolling.
    if (e.pointerType !== "mouse") return;
    if (e.button !== 0) return;

    const initial: DefinitionDragState = {
      targetValue,
      displayTarget,
      sourceWordId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoveredWordId: null,
    };

    dragStateRef.current = initial;
    setDragState(initial);
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const prev = dragStateRef.current;
      if (!prev) return;

      const dist = Math.hypot(e.clientX - prev.startX, e.clientY - prev.startY);
      const isDragging = prev.isDragging || dist >= 6;
      const hoveredWordId = isDragging
        ? findWordDropTargetAtPoint(e.clientX, e.clientY)
        : null;

      const next: DefinitionDragState = {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging,
        hoveredWordId,
      };
      dragStateRef.current = next;
      setDragState(next);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const current = dragStateRef.current;
      dragStateRef.current = null;
      setDragState(null);

      if (!current) return;

      if (current.isDragging) {
        const targetWordId = findWordDropTargetAtPoint(e.clientX, e.clientY);
        if (targetWordId !== null) {
          assignTargetToWord(targetWordId, current.targetValue);
          setSelectedTargetValue(null);
        }
      } else if (current.sourceWordId === null) {
        // Short click on an available definition: toggle tap-to-match selection
        setSelectedTargetValue((prevVal) =>
          prevVal === current.targetValue ? null : current.targetValue
        );
      }
    };

    const handlePointerCancel = () => {
      dragStateRef.current = null;
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  });

  const handleAvailableDefinitionTap = (targetValue: string) => {
    if (isLocked) return;
    // For mouse, short clicks are handled in pointerup; handle touch & keyboard activations here
    setSelectedTargetValue((prev) => (prev === targetValue ? null : targetValue));
  };

  const handleWordCardClick = (wordId: number) => {
    if (isLocked) return;
    if (selectedTargetValue !== null) {
      assignTargetToWord(wordId, selectedTargetValue);
      setSelectedTargetValue(null);
    }
  };

  const selectedDisplayText = useMemo(() => {
    if (!selectedTargetValue) return null;
    return (
      shuffledTargets.find((t) => t.targetValue === selectedTargetValue)
        ?.displayTarget ?? selectedTargetValue
    );
  }, [selectedTargetValue, shuffledTargets]);

  return (
    <div className="space-y-5">
      {/* Instructions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-start sm:items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Hướng dẫn:</strong> {instructionText}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Badge variant="secondary" className="font-mono text-[11px]">
            {matchedCount}/{items.length} đã ghép
          </Badge>
          <Badge variant="outline" className="font-mono text-[11px]">
            {countLabel}
          </Badge>
        </div>
      </div>

      {/* Mobile & Click-to-Match Active Selection Banner (sticky below TestProgress when selected) */}
      <AnimatePresence>
        {selectedTargetValue !== null && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: EASING.smooth }}
            className="sticky z-10 flex items-center justify-between gap-3 rounded-xl border-2 border-primary bg-background/95 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-md"
            style={{ top: "calc(var(--test-progress-offset, 118px) + 8px)" }}
          >
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <ArrowDownLeft className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <span className="font-bold text-primary block sm:inline">
                  Đã chọn:{" "}
                </span>
                <span className="text-foreground font-medium line-clamp-1 sm:inline">
                  &ldquo;{selectedDisplayText}&rdquo;
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  {" "}
                  — nhấn vào thẻ từ vựng để gắn vào
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTargetValue(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted cursor-pointer shrink-0"
            >
              <X className="h-3 w-3" />
              <span>Bỏ chọn</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Layout:
          - Desktop (md+): 2 columns side-by-side: LEFT = Fixed Words (Parent), RIGHT = Draggable Definitions
          - Mobile (< md): Vertical stack: Available Definitions on top (order-1), Fixed Word Cards below (order-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN (Desktop) / BOTTOM SECTION (Mobile): Fixed Parent Vocabulary Word Cards */}
        <div className="order-2 md:order-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {leftColumnTitle}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {selectedTargetValue
                ? "Chạm thẻ từ để gắn"
                : "Thả định nghĩa vào thẻ từ"}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const qKey = getQuestionKey(
                setIndex,
                exerciseIndex,
                exerciseType,
                item.id
              );
              const matchedValue = userAnswers[qKey] || "";
              const hasMatch = matchedValue.length > 0;
              const matchedDisplay =
                items.find((i) => i.targetValue === matchedValue)?.displayTarget ??
                matchedValue;

              const isDropHovered =
                dragState?.isDragging && dragState.hoveredWordId === item.id;
              const isReplacingHovered =
                isDropHovered &&
                hasMatch &&
                dragState?.targetValue !== matchedValue;
              const isChildBeingDragged =
                dragState?.isDragging &&
                dragState.sourceWordId === item.id;
              const isTapReady = selectedTargetValue !== null && !isLocked;

              const isCorrect = isChecked
                ? checkSingleAnswer(
                    exerciseType,
                    matchedValue,
                    item.correctCheckTarget
                  )
                : null;

              return (
                <div
                  key={item.id}
                  data-word-drop-id={item.id}
                  role={isTapReady ? "button" : undefined}
                  tabIndex={isTapReady ? 0 : undefined}
                  onClick={() => handleWordCardClick(item.id)}
                  onKeyDown={(e) => {
                    if (isTapReady && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleWordCardClick(item.id);
                    }
                  }}
                  className={cn(
                    "rounded-2xl border p-3.5 sm:p-4 transition-all duration-150",
                    isTapReady && "cursor-pointer",
                    isDropHovered
                      ? "border-primary bg-primary/[0.08] ring-2 ring-primary/35 shadow-sm"
                      : isChecked
                      ? isCorrect
                        ? "border-emerald-500/45 bg-emerald-500/[0.04]"
                        : "border-destructive/45 bg-destructive/[0.04]"
                      : isTapReady
                      ? "border-primary/40 bg-card hover:border-primary hover:bg-primary/[0.04]"
                      : hasMatch
                      ? "border-primary/35 bg-card shadow-2xs"
                      : "border-border/80 bg-card"
                  )}
                >
                  {/* Parent Header: Stationary Vocabulary Word */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                      {item.word}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isChecked ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đúng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs">
                            <XCircle className="h-4 w-4" />
                            <span>Sai</span>
                          </span>
                        )
                      ) : isReplacingHovered ? (
                        <Badge className="text-[10px] font-semibold gap-1 bg-amber-500 text-white">
                          <Replace className="h-3 w-3" />
                          <span>Thả để thay thế</span>
                        </Badge>
                      ) : isDropHovered ? (
                        <Badge className="text-[10px] font-semibold">
                          Thả vào đây
                        </Badge>
                      ) : isTapReady ? (
                        <span className="text-[11px] font-semibold text-primary">
                          {hasMatch ? "Chạm để thay thế" : "Chạm để ghép"}
                        </span>
                      ) : hasMatch ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20"
                        >
                          Đã ghép
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Chờ ghép
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nested Child Area inside Parent Word Card */}
                  <div className="mt-2.5 ml-1.5 sm:ml-2.5">
                    <AnimatePresence mode="wait" initial={false}>
                      {hasMatch ? (
                        <motion.div
                          key={`child-${matchedValue}`}
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: EASING.smooth }}
                          onPointerDown={(e) => {
                            if (isLocked) return;
                            // Allow dragging an already-matched definition to another word on desktop
                            e.stopPropagation();
                            startDefinitionDrag(
                              e,
                              matchedValue,
                              matchedDisplay,
                              item.id
                            );
                          }}
                          className={cn(
                            "rounded-xl border p-3 transition-all flex items-start justify-between gap-2.5",
                            !isLocked && "md:cursor-grab md:active:cursor-grabbing",
                            isChildBeingDragged
                              ? "opacity-40 border-dashed border-primary bg-primary/5"
                              : isReplacingHovered
                              ? "border-amber-500/50 bg-amber-500/10"
                              : isChecked
                              ? isCorrect
                                ? "border-emerald-500/35 bg-background/90"
                                : "border-destructive/35 bg-background/90"
                              : "border-primary/25 bg-muted/35 hover:border-primary/45"
                          )}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {!isLocked && (
                              <GripVertical className="hidden md:block h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                            )}
                            <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                              {matchedDisplay}
                            </p>
                          </div>

                          {!isLocked && (
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnpair(item.id);
                              }}
                              aria-label={`Bỏ ghép định nghĩa khỏi ${item.word}`}
                              title="Bỏ ghép"
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty-slot"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.14 }}
                          className={cn(
                            "rounded-xl border border-dashed px-3 py-2.5 text-xs transition-colors",
                            isDropHovered
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : isTapReady
                              ? "border-primary/45 bg-primary/[0.03] text-primary font-medium"
                              : "border-border/70 bg-muted/15 text-muted-foreground"
                          )}
                        >
                          {isDropHovered
                            ? "Thả định nghĩa để gắn vào từ này"
                            : isTapReady
                            ? "Nhấn vào đây để gắn định nghĩa đang chọn"
                            : isChecked
                            ? "(Chưa ghép đáp án)"
                            : "Kéo định nghĩa vào đây hoặc chọn từ danh sách"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Checked Mode: Correct Answer & Vietnamese Explanation */}
                  {isChecked && (
                    <div className="mt-3 pt-2.5 border-t border-border/70 space-y-1.5 text-xs">
                      {!isCorrect && (
                        <div className="text-muted-foreground">
                          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Đáp án đúng:{" "}
                          </strong>
                          <span className="text-foreground font-medium">
                            {item.correctAnswerDisplay}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5 text-foreground/85 bg-muted/40 p-2.5 rounded-lg leading-relaxed">
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

        {/* RIGHT COLUMN (Desktop) / TOP SECTION (Mobile): Draggable Available Definitions */}
        <div
          className="order-1 md:order-2 space-y-3 md:sticky"
          style={{ top: "calc(var(--test-progress-offset, 118px) + 8px)" }}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {rightColumnTitle}
            </span>
            <Badge variant="outline" className="text-[11px] font-mono">
              {availableTargets.length} khả dụng
            </Badge>
          </div>

          {availableTargets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-500/35 bg-emerald-500/5 p-5 text-center space-y-1.5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">
                Đã ghép toàn bộ {items.length} mục!
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Bạn vẫn có thể nhấn nút bỏ ghép trên từng thẻ từ hoặc kéo định nghĩa khác để thay thế trước khi kiểm tra.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 md:max-h-[calc(100vh-200px)] md:overflow-y-auto md:pr-1">
              <AnimatePresence initial={false}>
                {availableTargets.map((target, idx) => {
                  const isSelected = selectedTargetValue === target.targetValue;
                  const isDraggingThis =
                    dragState?.isDragging &&
                    dragState.sourceWordId === null &&
                    dragState.targetValue === target.targetValue;

                  return (
                    <motion.div
                      key={`${target.id}-${target.targetValue}-${idx}`}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: EASING.smooth }}
                      role="button"
                      tabIndex={isLocked ? -1 : 0}
                      aria-pressed={isSelected}
                      onPointerDown={(e) =>
                        startDefinitionDrag(
                          e,
                          target.targetValue,
                          target.displayTarget,
                          null
                        )
                      }
                      onClick={() => {
                        // Mouse short-clicks are handled in pointerup; handle touch/pen taps cleanly here
                        const pType = lastPointerTypeRef.current;
                        lastPointerTypeRef.current = null;
                        if (pType === "mouse") return;
                        handleAvailableDefinitionTap(target.targetValue);
                      }}
                      onKeyDown={(e) => {
                        if (!isLocked && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          handleAvailableDefinitionTap(target.targetValue);
                        }
                      }}
                      className={cn(
                        "rounded-2xl border p-3.5 sm:p-4 transition-all text-xs sm:text-sm leading-relaxed select-none min-h-[52px] flex items-start gap-2.5",
                        !isLocked && "cursor-pointer md:cursor-grab md:active:cursor-grabbing",
                        isDraggingThis
                          ? "opacity-40 border-dashed border-primary bg-primary/5 shadow-xs"
                          : isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/35 shadow-sm text-foreground font-medium"
                          : "border-border/80 bg-card hover:border-primary/45 hover:bg-muted/25 text-foreground/90 shadow-2xs"
                      )}
                    >
                      {!isLocked && (
                        <GripVertical className="hidden md:block h-4 w-4 text-muted-foreground/70 shrink-0 mt-0.5" />
                      )}
                      <span className="flex-1">{target.displayTarget}</span>
                      {isSelected && (
                        <Badge className="text-[10px] shrink-0 font-semibold">
                          Đang chọn
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Floating Drag Preview Ghost (Desktop Dragging) */}
      {dragState?.isDragging && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 z-50 pointer-events-none max-w-xs sm:max-w-sm"
          style={{
            transform: `translate3d(${dragState.currentX + 14}px, ${
              dragState.currentY - 20
            }px, 0)`,
          }}
        >
          <div className="flex items-start gap-2 rounded-2xl border-2 border-primary bg-background/95 p-3.5 text-xs sm:text-sm text-foreground shadow-xl backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="line-clamp-3 font-medium leading-relaxed">
              {dragState.displayTarget}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
