"use client";

import React, { useMemo } from "react";
import {
  SynonymsMatchingExercise as SynonymsMatchingType,
  TestMode,
} from "@/types/vocabee-test";
import { MatchingBoard, type MatchingBoardItem } from "./MatchingBoard";

interface SynonymsMatchingExerciseProps {
  exercise: SynonymsMatchingType;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
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
  const boardItems: MatchingBoardItem[] = useMemo(
    () =>
      exercise.items.map((item) => {
        const joined = item.synonyms.join(", ");
        return {
          id: item.id,
          word: item.word,
          targetValue: joined,
          displayTarget: joined,
          correctAnswerDisplay: joined,
          correctCheckTarget: item.synonyms,
          explanation: item.explanation,
        };
      }),
    [exercise.items]
  );

  return (
    <MatchingBoard
      exerciseType="synonyms_matching"
      items={boardItems}
      setIndex={setIndex}
      exerciseIndex={exerciseIndex}
      userAnswers={userAnswers}
      onAnswerChange={onAnswerChange}
      mode={mode}
      isChecked={isChecked}
      instructionText="Kéo nhóm từ đồng nghĩa từ cột phải thả vào thẻ từ vựng cố định ở cột trái (hoặc chạm chọn rồi chạm vào từ)."
      countLabel={`${exercise.items.length} nhóm từ`}
      leftColumnTitle="Từ vựng gốc (Cố định)"
      rightColumnTitle="Nhóm từ đồng nghĩa khả dụng"
    />
  );
}
