"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Flame } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { DailyActivity } from "@/repositories/statistics.repository";
import { getCalendarDayKey } from "@/lib/streak";
import { subscribeStudyActivityUpdated } from "@/lib/events/study-events";
import { cn } from "@/lib/utils";

interface DailyStreakProps {
  streak: number;
  weeklyActivity: DailyActivity[];
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function DailyStreak({ streak, weeklyActivity }: DailyStreakProps) {
  const router = useRouter();

  useEffect(() => {
    return subscribeStudyActivityUpdated(() => {
      router.refresh();
    });
  }, [router]);

  const todayKey = getCalendarDayKey(new Date());

  const weekDays = WEEK_LABELS.map((label, idx) => {
    const dayData = weeklyActivity?.[idx];
    const dayKey = dayData ? getCalendarDayKey(new Date(dayData.date)) : null;
    const active = dayData
      ? dayData.studiedWords > 0 || dayData.reviewedWords > 0 || dayData.completed
      : false;
    return {
      label,
      active,
      isToday: dayKey === todayKey,
    };
  });

  const todayEntry = weekDays.find((day) => day.isToday);
  const yesterdayActive = [...weekDays].reverse().find((day) => !day.isToday && day.active);
  const todayIsActive = todayEntry?.active ?? false;
  const isPending = streak > 0 && Boolean(todayEntry) && !todayIsActive && Boolean(yesterdayActive);
  const isActive = streak > 0 && todayIsActive;
  const isBroken = streak === 0;
  const isMuted = isPending || isBroken;
  const subtitle = isActive
    ? "Đã ghi nhận hoạt động hôm nay"
    : isPending
      ? "Học hôm nay để giữ chuỗi liên tiếp"
      : "Hoàn thành 1 bài học để mở chuỗi";

  return (
    <SectionCard className="flex h-full flex-col justify-between gap-4">
      <div>
        <SectionHeader
          title="Chuỗi ngày học"
          description="Duy trì thói quen học tập mỗi ngày"
          className="mb-3"
        />
        <div className="flex items-center gap-3.5 py-1">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
              isMuted
                ? "border-border bg-muted/50 text-muted-foreground"
                : "border-amber-500/25 bg-amber-500/10 text-amber-500 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
            )}
          >
            <Flame className="h-6 w-6 fill-current" />
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                "text-2xl sm:text-3xl font-bold tracking-tight tabular-nums",
                isMuted
                  ? "text-foreground/75"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {streak} ngày
            </div>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDays.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {day.label}
              </span>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                  day.active
                    ? "bg-amber-500 text-white shadow-2xs dark:bg-amber-500"
                    : day.isToday
                      ? "border border-dashed border-primary/60 bg-primary/5 text-primary"
                      : "bg-background/80 border border-border/60 text-muted-foreground/60"
                )}
              >
                {day.active ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : day.isToday && isPending ? (
                  <Flame className="h-3 w-3 fill-current" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
