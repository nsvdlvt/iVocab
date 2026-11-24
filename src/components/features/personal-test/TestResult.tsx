"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PersonalTestRecord,
  PersonalTestAttemptRecord,
  OverallGradingResult,
} from "@/types/vocabee-test";
import { AnswerReview } from "./AnswerReview";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  RotateCcw,
  ArrowLeft,
  Layers,
  BookOpen,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceStrict } from "date-fns";
import { vi } from "date-fns/locale";

interface TestResultProps {
  test: PersonalTestRecord;
  attempt: PersonalTestAttemptRecord;
  grading: OverallGradingResult;
  onRetry: () => void;
}

export function TestResult({
  test,
  attempt,
  grading,
  onRetry,
}: TestResultProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "review">("summary");

  const durationText =
    attempt.started_at && attempt.completed_at
      ? formatDistanceStrict(
          new Date(attempt.started_at),
          new Date(attempt.completed_at),
          { locale: vi }
        )
      : "1 phút";

  const isGreatScore = grading.score >= 80;
  const isPassScore = grading.score >= 50;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* 9.1 Summary Hero Header */}
      <div className="rounded-3xl border border-primary/20 bg-linear-to-b from-primary/10 via-amber-500/5 to-card p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg">
          <Trophy className="h-10 w-10 fill-current" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
            {attempt.mode === "practice" ? "Chế độ Luyện tập" : "Chế độ Thi thử"}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {test.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isGreatScore
              ? "Xuất sắc! Bạn đã làm chủ hoàn hảo các từ vựng trong bài kiểm tra này."
              : isPassScore
              ? "Làm tốt lắm! Bạn đã hoàn thành bài kiểm tra với kết quả khá tốt."
              : "Hãy tiếp tục cố gắng! Xem lại các câu trả lời sai để ghi nhớ từ vựng sâu hơn nhé."}
          </p>
        </div>

        {/* Big Score Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-foreground">
            {grading.score}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">/100</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-1">
            Độ chính xác: {grading.accuracyPercentage}%
          </span>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <span>Tổng câu hỏi</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {grading.totalQuestions}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Trả lời đúng</span>
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {grading.correctAnswers}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>Trả lời sai</span>
            </div>
            <div className="text-lg font-bold text-destructive">
              {grading.incorrectAnswers}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>Thời gian</span>
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {durationText}
            </div>
          </div>
        </div>

        {/* 9.5 Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onRetry}
            className="gap-2 cursor-pointer font-bold rounded-xl shadow-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Làm lại bài thi</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setActiveTab(activeTab === "summary" ? "review" : "summary")}
            className="gap-2 cursor-pointer font-semibold rounded-xl bg-background"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{activeTab === "summary" ? "Xem chi tiết đáp án" : "Xem tổng quan điểm số"}</span>
          </Button>

          <Link
            href="/u/personal-test"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "gap-2 cursor-pointer text-muted-foreground hover:text-foreground rounded-xl"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về danh sách</span>
          </Link>
        </div>
      </div>

      {activeTab === "summary" ? (
        <div className="space-y-6">
          {/* 9.2 Set Performance Breakdown */}
          {grading.setSummaries.length > 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Kết quả theo từng Set từ vựng
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {grading.setSummaries.map((set) => (
                  <Card key={set.setIndex} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sm text-foreground truncate">
                        {set.setLabel}
                      </span>
                      <span className="font-bold text-primary text-sm font-mono">
                        {set.score}đ
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Độ chính xác</span>
                        <span>{set.correctQuestions}/{set.totalQuestions} câu</span>
                      </div>
                      <Progress value={set.score} className="h-2" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 9.3 Exercise Performance Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Hiệu suất theo dạng bài tập (4 kỹ năng)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {grading.exerciseSummaries.map((ex) => (
                <Card key={ex.exerciseType} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      {ex.exerciseType}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {ex.exerciseLabel}
                    </h4>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Đúng {ex.correctQuestions}/{ex.totalQuestions} câu</span>
                      <strong className="font-mono text-primary font-bold">{ex.score}%</strong>
                    </div>
                    <Progress value={ex.score} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Prompt to view review */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Xem lại toàn bộ câu hỏi và giải thích tiếng Việt
              </h4>
              <p className="text-xs text-muted-foreground">
                Kiểm tra chi tiết từng câu hỏi bạn đã làm đúng hay sai kèm giải thích ý nghĩa ngữ cảnh.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setActiveTab("review")}
              className="cursor-pointer text-xs font-semibold shrink-0 rounded-xl"
            >
              Mở bảng xem lại đáp án
            </Button>
          </div>
        </div>
      ) : (
        /* 9.4 Detailed Review */
        <AnswerReview questionResults={grading.questionResults} />
      )}
    </div>
  );
}
