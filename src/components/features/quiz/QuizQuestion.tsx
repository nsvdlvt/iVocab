"use client";

import React from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { QuizQuestion as QuestionType } from "@/types/quiz";

interface QuizQuestionProps {
  question: QuestionType;
}

export function QuizQuestion({ question }: QuizQuestionProps) {
  return (
    <SectionCard className="p-6 md:p-8 bg-card border-border shadow-sm text-center">
      <h4 className="text-lg md:text-xl font-bold text-foreground leading-relaxed">
        {question.question}
      </h4>
    </SectionCard>
  );
}
