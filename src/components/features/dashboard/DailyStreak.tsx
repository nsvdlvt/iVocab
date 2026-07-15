import React from "react";
import { Flame } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { DailyActivity } from "@/repositories/statistics.repository";

interface DailyStreakProps {
  streak: number;
  weeklyActivity: DailyActivity[];
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function DailyStreak({ streak, weeklyActivity }: DailyStreakProps) {
  // Use actual weekly activity data
  const weekDays = WEEK_LABELS.map((label, idx) => {
    const dayData = weeklyActivity?.[idx];
    const active = dayData ? dayData.studiedWords > 0 || dayData.reviewedWords > 0 || dayData.completed : false;
    return {
      label,
      active,
    };
  });

  return (
    <SectionCard className="flex flex-col h-full justify-between">
      <div>
        <SectionHeader
          title="Chuỗi học tập (Streak)"
          description="Duy trì học tập liên tục"
        />
        <div className="my-4 flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-500">
            <Flame className="h-8 w-8 fill-current" />
          </div>
          <div>
            {streak > 0 ? (
              <>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {streak} ngày
                </div>
                <p className="text-xs text-muted-foreground">liên tiếp học tập</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-extrabold text-muted-foreground">0 ngày</div>
                <p className="text-xs text-muted-foreground">Hãy bắt đầu hôm nay!</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 text-center mt-2">
          {weekDays.map((day, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground">{day.label}</div>
              <div
                className={`mx-auto h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm transition-all duration-200 ${
                  day.active
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.active ? "✓" : "·"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
