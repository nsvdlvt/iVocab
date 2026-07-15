import React from "react";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { DailyProgress } from "@/repositories/statistics.repository";

interface LearningProgressProps {
  progress: DailyProgress;
}

export function LearningProgress({ progress }: LearningProgressProps) {
  const goal = progress.goal > 0 ? progress.goal : 20;
  const totalActivity = progress.studiedWords + progress.reviewedWords; // Or use total logic from backend
  // For simplicity, we just use the progressPercent calculated by the backend
  const progressPercent = progress.progressPercent;

  return (
    <SectionCard className="flex flex-col h-full justify-between">
      <div>
        <SectionHeader
          title="Mục tiêu hôm nay"
          description="Tiến trình hoàn thành số từ mới"
        />
        <div className="my-5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-primary">{totalActivity}</span>
            <span className="text-sm text-muted-foreground">/ {goal} hoạt động</span>
          </div>
          <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 rounded-full mb-4" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
        {progressPercent >= 100
          ? "Chúc mừng! Bạn đã hoàn thành xuất sắc mục tiêu học tập hôm nay. Cùng giữ vững phong độ nhé!"
          : totalActivity === 0
          ? "Hãy bắt đầu học hôm nay để đạt mục tiêu của bạn!"
          : `Bạn còn cách mục tiêu ${goal - totalActivity} hoạt động nữa. Hãy dành thêm ít phút nhé!`}
      </p>
    </SectionCard>
  );
}
