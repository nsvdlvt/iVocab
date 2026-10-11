"use client";

import React, { useState } from "react";
import { RotateCw, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { QuizOptions } from "./QuizOptions";
import { QuizProgress } from "./QuizProgress";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/repositories/quiz.repository";

interface QuizClientProps {
  questions: QuizQuestion[];
}

export function QuizClient({ questions }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;

  const handleAnswer = (wasCorrect: boolean) => {
    if (wasCorrect) setCorrectCount((n) => n + 1);
    if (currentIndex + 1 >= total) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (completed) {
    const accuracy = Math.round((correctCount / total) * 100);
    const isPassing = accuracy >= 70;
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-10 border border-border rounded-2xl px-8 bg-card shadow-sm">
        <div className="flex justify-center">
          <div className={cn("rounded-full p-4", isPassing ? "bg-emerald-500/10" : "bg-amber-500/10")}>
            <PartyPopper className={cn("h-10 w-10", isPassing ? "text-emerald-500" : "text-amber-500")} />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-foreground">
            {isPassing ? "Xuất sắc!" : "Cần cố gắng thêm!"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Bạn đã hoàn thành bài trắc nghiệm gồm {total} câu hỏi.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{correctCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Đúng</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">{total - correctCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Sai</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="text-2xl font-extrabold text-primary tabular-nums">{accuracy}%</div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Độ chính xác</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setCurrentIndex(0);
            setCompleted(false);
            setCorrectCount(0);
          }}
          className="rounded-xl cursor-pointer font-bold px-6"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Làm lại bài thi
        </Button>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <QuizProgress current={currentIndex + 1} total={total} />

      {/* Question card */}
      <SectionCard className="p-6 md:p-10 bg-card border-border shadow-sm text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Chọn nghĩa tiếng Việt đúng
        </p>
        <h4 className="text-xl md:text-2xl font-extrabold text-foreground leading-relaxed">
          Nghĩa của từ &ldquo;<span className="text-primary">{current.word}</span>&rdquo; là gì?
        </h4>
      </SectionCard>

      {/* Answer options */}
      <QuizOptions
        options={current.options}
        correctIndex={current.correctIndex}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
