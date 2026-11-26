"use client";

import React, { useMemo } from "react";
import { MatchingExercise as MatchingExerciseType, TestMode } from "@/types/vocabee-test";
import { MatchingBoard, type MatchingBoardItem } from "./MatchingBoard";

interface MatchingExerciseProps {
  exercise: MatchingExerciseType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
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
  const boardItems: MatchingBoardItem[] = useMemo(
    () =>
      exercise.items.map((item) => ({
        id: item.id,
        word: item.word,
        targetValue: item.definition,
        displayTarget: item.definition,
        correctAnswerDisplay: item.definition,
        correctCheckTarget: item.definition,
        explanation: item.explanation,
      })),
    [exercise.items]
  );

  return (
    <MatchingBoard
      exerciseType="matching"
      items={boardItems}
      setIndex={setIndex}
      exerciseIndex={exerciseIndex}
      userAnswers={userAnswers}
      onAnswerChange={onAnswerChange}
      mode={mode}
      isChecked={isChecked}
      instructionText="Kéo định nghĩa từ cột phải thả vào thẻ từ vựng cố định ở cột trái (hoặc chạm chọn định nghĩa rồi chạm vào từ)."
      countLabel={`${exercise.items.length} cặp từ`}
      leftColumnTitle="Từ vựng (Cố định)"
      rightColumnTitle="Định nghĩa khả dụng"
    />
  );
}
