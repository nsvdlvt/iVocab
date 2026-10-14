"use client";

import React from "react";
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Award, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ComprehensionQuestion, ComprehensionProgress } from "./reading-types";

interface ReadingComprehensionProps {
  articleId: string;
  articleTitle: string;
  questions: ComprehensionQuestion[];
  onScrollToParagraph?: (paragraphIndex: number) => void;
  onScoreChange?: (score: number, total: number) => void;
}

export function ReadingComprehension({
  articleId,
  articleTitle,
  questions,
  onScrollToParagraph,
  onScoreChange,
}: ReadingComprehensionProps) {
  const STORAGE_KEY = `ivocab:reading:quiz:${articleId}`;

  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // Restore saved quiz results from localStorage
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ComprehensionProgress;
        if (parsed.selectedAnswers) {
          setSelectedAnswers(parsed.selectedAnswers);
          setIsSubmitted(Boolean(parsed.isSubmitted));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [STORAGE_KEY]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const correctCount = React.useMemo(() => {
    return questions.reduce((acc, q) => {
      return selectedAnswers[q.id] === q.correctAnswer ? acc + 1 : acc;
    }, 0);
  }, [questions, selectedAnswers]);

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return; // Locked after submission until retake
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = correctCount;
    onScoreChange?.(score, totalQuestions);

    try {
      const payload: ComprehensionProgress = {
        selectedAnswers,
        isSubmitted: true,
        score,
        completedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore localStorage write errors
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    onScoreChange?.(0, totalQuestions);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-border/70 bg-card">
        <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Chưa có câu hỏi đọc hiểu cho bài này</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nội dung đang được ban biên tập cập nhật thêm câu hỏi rèn luyện kỹ năng đọc hiểu.
        </p>
      </Card>
    );
  }

  return (
    <div id="comprehension-section" className="space-y-6">
      {/* Quiz Header & Score Card */}
      <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                Luyện tập đọc hiểu
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Reading Comprehension Quiz
              </h2>
              <p className="text-sm text-muted-foreground">
                Trả lời các câu hỏi trắc nghiệm dưới đây để kiểm tra mức độ nắm bắt ý chính và chi tiết bài đọc.
              </p>
            </div>

            {isSubmitted ? (
              <div className="flex items-center gap-3 shrink-0 bg-background/80 backdrop-blur px-4 py-3 rounded-2xl border border-border/70 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {scorePercentage}%
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Kết quả</div>
                  <div className="text-sm font-bold text-foreground">
                    {correctCount} / {totalQuestions} câu đúng
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Tiến độ: {answeredCount} / {totalQuestions} câu
                </span>
                <Progress value={(answeredCount / totalQuestions) * 100} className="w-36 h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Score banner when submitted */}
        {isSubmitted && (
          <div className="px-5 py-4 bg-muted/40 flex flex-wrap items-center justify-between gap-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">
                {scorePercentage === 100
                  ? "Xuất sắc! Bạn đã trả lời đúng tất cả các câu hỏi. 🎉"
                  : scorePercentage >= 70
                  ? "Làm rất tốt! Bạn đã nắm vững nội dung chính bài đọc. 👍"
                  : "Hãy đọc lại các đoạn được giải thích bên dưới để củng cố kỹ năng đọc hiểu nhé!"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="rounded-full gap-2 border-border/80"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Làm lại bài
            </Button>
          </div>
        )}

        {/* Questions List */}
        <div className="divide-y divide-border/60">
          {questions.map((q, qIndex) => {
            const selectedOpt = selectedAnswers[q.id];
            const isCorrect = isSubmitted && selectedOpt === q.correctAnswer;
            const isWrong = isSubmitted && selectedOpt !== undefined && selectedOpt !== q.correctAnswer;

            return (
              <div key={q.id} className="p-5 sm:p-7 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        Câu {qIndex + 1}
                      </Badge>
                      {q.paragraphRef ? (
                        <button
                          type="button"
                          onClick={() => {
                            // parse paragraph number e.g. "Paragraph 1"
                            const match = q.paragraphRef?.match(/\d+/);
                            if (match) {
                              onScrollToParagraph?.(parseInt(match[0], 10) - 1);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          <BookOpen className="h-3 w-3" />
                          {q.paragraphRef}
                        </button>
                      ) : null}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {isSubmitted ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" /> Chính xác
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs shrink-0 bg-rose-500/10 px-2.5 py-1 rounded-full">
                        <XCircle className="h-4 w-4" /> Chưa đúng
                      </span>
                    )
                  ) : null}
                </div>

                {/* Options */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {q.options.map((option, optIndex) => {
                    const isSelected = selectedOpt === optIndex;
                    const isAnswerCorrect = isSubmitted && optIndex === q.correctAnswer;
                    const isAnswerWrong = isSubmitted && isSelected && !isAnswerCorrect;

                    let btnClass = "border-border/70 hover:bg-muted/60 text-foreground";
                    if (isSelected && !isSubmitted) {
                      btnClass = "border-primary bg-primary/10 text-primary font-medium ring-2 ring-primary/20";
                    } else if (isAnswerCorrect) {
                      btnClass = "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-medium ring-2 ring-emerald-500/30";
                    } else if (isAnswerWrong) {
                      btnClass = "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200 font-medium ring-2 ring-rose-500/30";
                    }

                    const optionLetter = String.fromCharCode(65 + optIndex);

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-xl border text-left text-sm transition-all duration-150 leading-relaxed",
                          btnClass,
                          !isSubmitted && "cursor-pointer active:scale-[0.99]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                            isSelected && !isSubmitted
                              ? "bg-primary text-primary-foreground"
                              : isAnswerCorrect
                              ? "bg-emerald-600 text-white"
                              : isAnswerWrong
                              ? "bg-rose-600 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {isSubmitted && q.explanation && (
                  <div className="mt-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-foreground space-y-1">
                    <div className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Giải thích chi tiết
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Bottom Bar */}
        <div className="p-5 sm:p-6 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            {!isSubmitted
              ? `Bạn đã hoàn thành ${answeredCount} trên tổng số ${totalQuestions} câu hỏi.`
              : "Bạn có thể làm lại bài bất cứ lúc nào để củng cố lại kiến thức."}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSubmitted ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="w-full sm:w-auto rounded-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Làm lại bài
              </Button>
            ) : (
              <Button
                type="button"
                disabled={answeredCount === 0}
                onClick={handleSubmit}
                className="w-full sm:w-auto rounded-full px-6 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Kiểm tra đáp án ({answeredCount}/{totalQuestions})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
