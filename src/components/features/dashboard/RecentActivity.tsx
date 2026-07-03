"use client";

import React from "react";
import { BookOpen, GraduationCap, Gamepad2, Bot } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { mockUserActivities } from "@/mock/user";
import { cn } from "@/lib/utils";

export function RecentActivity() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "learn":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "review":
        return <GraduationCap className="h-4 w-4 text-violet-500" />;
      case "quiz":
        return <Gamepad2 className="h-4 w-4 text-amber-500" />;
      case "ai":
        return <Bot className="h-4 w-4 text-rose-500" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "learn":
        return "bg-blue-500/10";
      case "review":
        return "bg-violet-500/10";
      case "quiz":
        return "bg-amber-500/10";
      case "ai":
        return "bg-rose-500/10";
      default:
        return "bg-muted";
    }
  };

  return (
    <SectionCard className="h-full">
      <SectionHeader
        title="Hoạt động gần đây"
        description="Lịch sử học tập của bạn"
      />
      <div className="relative border-l border-border pl-4 ml-3 py-2 space-y-6 mt-4">
        {mockUserActivities.map((act) => (
          <div key={act.id} className="relative flex items-start gap-3">
            {/* Timeline Dot with Icon */}
            <div
              className={cn(
                "absolute -left-[29px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-background bg-card shadow-sm",
                getActivityColor(act.activityType)
              )}
            >
              {getActivityIcon(act.activityType)}
            </div>

            {/* Content */}
            <div className="space-y-1">
              <p className="text-xs md:text-sm font-medium text-foreground leading-snug">
                {act.description}
              </p>
              <span className="text-[10px] text-muted-foreground block">{act.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
