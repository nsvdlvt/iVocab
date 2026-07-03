"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { mockUserProfile } from "@/mock/user";

export function LearningProgress() {
  const currentLearnedToday = 12;
  const goal = mockUserProfile.dailyGoal;
  const progressPercent = Math.min(Math.round((currentLearnedToday / goal) * 100), 100);

  return (
    <SectionCard className="flex flex-col h-full justify-between">
      <div>
        <SectionHeader
          title="Mục tiêu hôm nay"
          description="Tiến trình hoàn thành số từ mới"
        />
        <div className="my-5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-primary">{currentLearnedToday}</span>
            <span className="text-sm text-muted-foreground">/ {goal} từ mới</span>
          </div>
          <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 rounded-full mb-4" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
        {progressPercent >= 100
          ? "Chúc mừng! Bạn đã hoàn thành xuất sắc mục tiêu học tập hôm nay. Cùng giữ vững phong độ nhé!"
          : `Bạn còn cách mục tiêu ${goal - currentLearnedToday} từ mới nữa. Hãy dành thêm ít phút nhé!`}
      </p>
    </SectionCard>
  );
}
