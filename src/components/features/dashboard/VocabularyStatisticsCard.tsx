import React from "react";
import Link from "next/link";
import { BookOpen, Clock3, GraduationCap, Medal } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { cn } from "@/lib/utils";
import type { VocabularyStats } from "@/lib/statistics/vocabulary-stats.service";

interface VocabularyStatisticsCardProps {
  stats: VocabularyStats;
}

const STAT_ITEMS = [
  {
    key: "totalWords",
    label: "Tổng số từ",
    icon: BookOpen,
    iconClassName: "text-sky-600 dark:text-sky-400",
    iconBgClassName: "bg-sky-500/10 border-sky-500/20",
    href: "/vocabulary-management",
  },
  {
    key: "learnedWords",
    label: "Đã thuộc",
    icon: GraduationCap,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    iconBgClassName: "bg-emerald-500/10 border-emerald-500/20",
    href: "/vocabulary-management?status=learned",
  },
  {
    key: "masteredWords",
    label: "Thành thạo",
    icon: Medal,
    iconClassName: "text-amber-600 dark:text-amber-400",
    iconBgClassName: "bg-amber-500/10 border-amber-500/20",
    href: "/vocabulary-management?status=mastered",
  },
  {
    key: "dueToday",
    label: "Đến hạn ôn",
    icon: Clock3,
    iconClassName: "text-rose-600 dark:text-rose-400",
    iconBgClassName: "bg-rose-500/10 border-rose-500/20",
    href: "/review",
  },
] as const;

export function VocabularyStatisticsCard({ stats }: VocabularyStatisticsCardProps) {
  return (
    <SectionCard className="flex h-full flex-col justify-between gap-4">
      <SectionHeader
        title="Thống kê vốn từ"
        description="Tổng quan mức độ ghi nhớ từ vựng"
        className="mb-0"
      />

      <div className="grid grid-cols-2 gap-2.5">
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = stats[item.key];
          const isDueWords = item.key === "dueToday" && value > 0;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "group rounded-xl border border-border/70 bg-muted/20 p-3 transition-all duration-150 hover:border-primary/30 hover:bg-muted/40",
                isDueWords &&
                  "border-rose-500/25 bg-rose-500/[0.06] hover:border-rose-500/40 dark:border-rose-500/30 dark:bg-rose-500/10"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    item.iconBgClassName
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.iconClassName)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold tracking-tight tabular-nums text-foreground leading-tight mt-0.5">
                    {value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
