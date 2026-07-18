import React from "react";
import { Flame } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { DailyActivity } from "@/repositories/statistics.repository";
import { getCalendarDayKey } from "@/lib/streak";

interface DailyStreakProps {
  streak: number;
  weeklyActivity: DailyActivity[];
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function DailyStreak({ streak, weeklyActivity }: DailyStreakProps) {
  const todayKey = getCalendarDayKey(new Date());

  const weekDays = WEEK_LABELS.map((label, idx) => {
    const dayData = weeklyActivity?.[idx];
    const dayKey = dayData ? getCalendarDayKey(new Date(dayData.date)) : null;
    const active = dayData ? dayData.studiedWords > 0 || dayData.reviewedWords > 0 || dayData.completed : false;
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
    ? "Liên tiếp học tập"
    : isPending
      ? "Học hôm nay để duy trì chuỗi."
      : "Hãy bắt đầu hôm nay!";

  return (
    <SectionCard className="flex h-full flex-col justify-between">
      <div>
        <SectionHeader title="Chuỗi học tập (Streak)" description="Duy trì học tập liên tục" />
        <div className="my-4 flex items-center gap-3">
          <div className={isMuted ? "rounded-2xl bg-slate-500/10 p-2 text-slate-400" : "rounded-2xl bg-amber-500/10 p-2 text-amber-500"}>
            <Flame className="h-8 w-8 fill-current" />
          </div>
          <div>
            {streak > 0 ? (
              <>
                <div className={isMuted ? "text-3xl font-extrabold text-slate-400 dark:text-slate-500" : "text-3xl font-extrabold text-amber-600 dark:text-amber-400"}>
                  {streak} ngày
                </div>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-extrabold text-slate-400 dark:text-slate-500">0 ngày</div>
                <p className="text-xs text-muted-foreground">Hãy bắt đầu hôm nay!</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground">{day.label}</div>
              <div
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${
                  day.active
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : day.isToday && isPending
                      ? "bg-muted text-slate-400 dark:text-slate-500"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {day.active ? "✓" : day.isToday && isPending ? <Flame className="h-3 w-3 fill-current" /> : "·"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
