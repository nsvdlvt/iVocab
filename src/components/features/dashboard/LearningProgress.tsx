import React from "react";
import { CheckCircle2, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { DailyProgress, TodaySummary } from "@/repositories/statistics.repository";

interface LearningProgressProps {
  progress: DailyProgress;
  todaySummary?: TodaySummary;
}

export function LearningProgress({ progress, todaySummary }: LearningProgressProps) {
  const goal = progress.goal > 0 ? progress.goal : 20;
  const practiceCount = todaySummary
    ? todaySummary.quizzesCompleted +
      todaySummary.dictationsCompleted +
      todaySummary.sentencesCompleted
    : 0;
  const totalActivity = progress.studiedWords + progress.reviewedWords + practiceCount;
  const progressPercent = progress.progressPercent;

  return (
    <SectionCard className="flex flex-col h-full justify-between gap-4">
      <div>
        <SectionHeader
          title="Mục tiêu hôm nay"
          description="Tiến độ hoàn thành hoạt động trong ngày"
          className="mb-3"
          action={
            <Badge variant={progressPercent >= 100 ? "success" : "default"} className="tabular-nums">
              {progressPercent}%
            </Badge>
          }
        />

        <div className="flex items-center gap-3.5 py-1 mb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            {progressPercent >= 100 ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Target className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {totalActivity}
              </span>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                / {goal} hoạt động
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progressPercent >= 100
                ? "Đã hoàn thành xuất sắc mục tiêu hôm nay!"
                : totalActivity === 0
                  ? "Bắt đầu học hoặc ôn tập để tính tiến độ"
                  : `Còn ${Math.max(goal - totalActivity, 0)} hoạt động để đạt mục tiêu`}
            </p>
          </div>
        </div>

        <Progress value={progressPercent} className="h-2 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center">
        <div>
          <div className="text-sm font-bold tabular-nums text-foreground">
            {progress.studiedWords}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground">Từ mới</div>
        </div>
        <div className="border-x border-border/60">
          <div className="text-sm font-bold tabular-nums text-foreground">
            {progress.reviewedWords}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground">Đã ôn</div>
        </div>
        <div>
          <div className="text-sm font-bold tabular-nums text-foreground">
            {practiceCount}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground">Bài tập</div>
        </div>
      </div>
    </SectionCard>
  );
}
