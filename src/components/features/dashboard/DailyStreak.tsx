"use client";

import React from "react";
import { Flame } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { mockUserProfile } from "@/mock/user";

export function DailyStreak() {
  const weekDays = [
    { label: "T2", active: true },
    { label: "T3", active: true },
    { label: "T4", active: true },
    { label: "T5", active: true },
    { label: "T6", active: true },
    { label: "T7", active: false },
    { label: "CN", active: false },
  ];

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
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {mockUserProfile.streak} ngày
            </div>
            <p className="text-xs text-muted-foreground">liên tiếp học tập</p>
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
                ✓
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
