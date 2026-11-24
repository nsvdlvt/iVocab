"use client";

import React from "react";
import { VocabeeExercise, TestMode } from "@/types/vocabee-test";
import { MatchingExercise } from "./exercises/MatchingExercise";
import { SentenceCompletionExercise } from "./exercises/SentenceCompletionExercise";
import { SynonymsMatchingExercise } from "./exercises/SynonymsMatchingExercise";
import { ClozeTestExercise } from "./exercises/ClozeTestExercise";

interface ExerciseRendererProps {
  exercise: VocabeeExercise;
  setIndex: number;
  exerciseIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  mode: TestMode;
  isChecked: boolean;
}

export function ExerciseRenderer({
  exercise,
  setIndex,
  exerciseIndex,
  userAnswers,
  onAnswerChange,
  mode,
  isChecked,
}: ExerciseRendererProps) {
  switch (exercise.type) {
    case "matching":
      return (
        <MatchingExercise
          exercise={exercise}
          setIndex={setIndex}
          exerciseIndex={exerciseIndex}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          mode={mode}
          isChecked={isChecked}
        />
      );

    case "sentence_completion":
      return (
        <SentenceCompletionExercise
          exercise={exercise}
          setIndex={setIndex}
          exerciseIndex={exerciseIndex}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          mode={mode}
          isChecked={isChecked}
        />
      );

    case "synonyms_matching":
      return (
        <SynonymsMatchingExercise
          exercise={exercise}
          setIndex={setIndex}
          exerciseIndex={exerciseIndex}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          mode={mode}
          isChecked={isChecked}
        />
      );

    case "cloze_test":
      return (
        <ClozeTestExercise
          exercise={exercise}
          setIndex={setIndex}
          exerciseIndex={exerciseIndex}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          mode={mode}
          isChecked={isChecked}
        />
      );

    default: {
      const _exhaustiveCheck: never = exercise;
      return (
        <div className="p-4 text-sm text-destructive">
          Loại bài tập không được hỗ trợ.
        </div>
      );
    }
  }
}
