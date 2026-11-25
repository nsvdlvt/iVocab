// src/components/features/ai/floating-chat/AgentResultCards.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ListChecks,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AgentResultCard,
  ExerciseQuestionCardItem,
} from "@/lib/ai/agent/types";

function InteractiveQuizCard({ card }: { card: AgentResultCard }) {
  const questions = card.questions ?? [];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});

  const submitAnswer = async (q: ExerciseQuestionCardItem, userAnswer: string) => {
    const clean = userAnswer.trim();
    if (!clean || selectedAnswers[q.id]) return;

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: clean }));
    const isCorrect =
      clean.toLowerCase() === q.correctAnswer.trim().toLowerCase();

    // Only submit validated user exercise results through Vocabee's existing SRS endpoint
    if (q.vocabularyId) {
      await fetch("/api/srs/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabularyId: q.vocabularyId,
          mode: "learn",
          answerResult: isCorrect ? "correct" : "wrong",
        }),
      }).catch(() => {});
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl border border-border bg-background/80 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
        <div>
          <h4 className="text-xs font-semibold text-foreground">{card.title}</h4>
          {card.subtitle && (
            <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const chosen = selectedAnswers[q.id];
          const isAnswered = Boolean(chosen);
          const isCorrect =
            isAnswered &&
            chosen.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

          return (
            <div
              key={q.id}
              className="rounded-lg border border-border/70 bg-card p-2.5 space-y-2"
            >
              <p className="text-xs font-medium text-foreground leading-relaxed">
                {idx + 1}. {q.prompt}
              </p>

              {q.options && q.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options.map((opt) => {
                    const isThisChosen = chosen === opt;
                    const isThisCorrect =
                      opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => void submitAnswer(q, opt)}
                        className={cn(
                          "w-full text-left rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                          !isAnswered &&
                            "border-border bg-background hover:bg-accent hover:border-primary/40",
                          isAnswered &&
                            isThisCorrect &&
                            "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium",
                          isAnswered &&
                            isThisChosen &&
                            !isThisCorrect &&
                            "border-destructive/60 bg-destructive/10 text-destructive"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    disabled={isAnswered}
                    value={textInputs[q.id] ?? ""}
                    onChange={(e) =>
                      setTextInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Nhập đáp án..."
                    className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAnswered || !(textInputs[q.id] ?? "").trim()}
                    onClick={() => void submitAnswer(q, textInputs[q.id] ?? "")}
                    className="h-7 px-2.5 text-xs cursor-pointer"
                  >
                    Kiểm tra
                  </Button>
                </div>
              )}

              {isAnswered && (
                <div
                  className={cn(
                    "flex items-start gap-1.5 rounded-md p-2 text-[11px]",
                    isCorrect
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    {!isCorrect && (
                      <div className="font-semibold">
                        Đáp án đúng: {q.correctAnswer}
                      </div>
                    )}
                    <p>{q.explanation}</p>
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

export function AgentResultCards({ cards }: { cards: AgentResultCard[] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {cards.map((card) => {
        if (card.kind === "practice_quiz") {
          return <InteractiveQuizCard key={card.id} card={card} />;
        }

        if (card.kind === "action_result") {
          return (
            <div
              key={card.id}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {card.subtitle || card.title}
                </span>
              </div>
              {card.actionUrl && (
                <Link
                  href={card.actionUrl}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
                >
                  <span>Mở</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        }

        const Icon =
          card.kind === "learning_stats"
            ? BarChart3
            : card.kind === "vocab_sets"
            ? BookOpen
            : ListChecks;

        return (
          <div
            key={card.id}
            className="rounded-xl border border-border/80 bg-background/70 p-2.5 space-y-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{card.title}</span>
            </div>

            {card.metrics && card.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {card.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border/60 bg-card px-2 py-1.5"
                  >
                    <div className="text-[10px] text-muted-foreground truncate">
                      {m.label}
                    </div>
                    <div className="text-xs font-bold text-foreground truncate">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {card.items && card.items.length > 0 && (
              <div className="divide-y divide-border/50 max-h-44 overflow-y-auto rounded-lg border border-border/60 bg-card">
                {card.items.map((item, idx) => (
                  <div
                    key={item.id ?? idx}
                    className="px-2.5 py-1.5 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-muted-foreground truncate">
                          {item.subtitle}
                        </div>
                      )}
                      {item.detail && (
                        <div className="text-[10px] text-muted-foreground/80 truncate">
                          {item.detail}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
