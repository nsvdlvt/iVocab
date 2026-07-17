import React from "react";
import { BookOpen, GraduationCap, Medal, Clock3 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { DashboardVocabularyStats } from "@/repositories/review.repository";

interface VocabularyStatisticsCardProps {
  stats: DashboardVocabularyStats;
}

const STAT_ITEMS = [
  {
    key: "totalWords",
    label: "Tổng số từ",
    icon: BookOpen,
    iconClassName: "text-sky-600 dark:text-sky-400",
    iconBgClassName: "bg-sky-500/10",
  },
  {
    key: "learnedWords",
    label: "Đã thuộc",
    icon: GraduationCap,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    iconBgClassName: "bg-emerald-500/10",
  },
  {
    key: "masteredWords",
    label: "Thành thạo",
    icon: Medal,
    iconClassName: "text-amber-600 dark:text-amber-400",
    iconBgClassName: "bg-amber-500/10",
  },
  {
    key: "dueWords",
    label: "Từ đến hạn",
    icon: Clock3,
    iconClassName: "text-rose-600 dark:text-rose-400",
    iconBgClassName: "bg-rose-500/10",
  },
] as const;

export function VocabularyStatisticsCard({ stats }: VocabularyStatisticsCardProps) {
  return (
    <SectionCard className="h-full flex flex-col">
      <SectionHeader
        title="Thống kê từ vựng"
        description="Tổng quan tiến độ học tập của bạn"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = stats[item.key];

          return (
            <div key={item.key} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${item.iconBgClassName}`}>
                  <Icon className={`h-5 w-5 ${item.iconClassName}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
