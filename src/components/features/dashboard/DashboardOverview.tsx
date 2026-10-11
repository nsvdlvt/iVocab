import React from "react";
import Link from "next/link";
import {
  BookA,
  BookOpen,
  GraduationCap,
  PlusCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeSection } from "@/components/features/dashboard/WelcomeSection";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { VocabularyStatisticsCard } from "@/components/features/dashboard/VocabularyStatisticsCard";
import { TodayReview } from "@/components/features/dashboard/TodayReview";
import { RecentVocabularySets } from "@/components/features/dashboard/RecentVocabularySets";
import { DashboardStats } from "@/repositories/statistics.repository";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { Database } from "@/types/database";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface DashboardOverviewProps {
  displayName: string;
  stats: DashboardStats;
  recentSets?: VocabSetRow[];
  forecast?: UpcomingReviewSummary;
}

const QUICK_ACTIONS = [
  {
    title: "Tạo / Nhập bộ từ",
    description: "Nhập nhanh văn bản hoặc AI/OCR",
    href: "/vocabulary/new",
    icon: PlusCircle,
    iconColor: "text-primary bg-primary/10 border-primary/20",
  },
  {
    title: "Ôn tập ngắt quãng",
    description: "Luyện các từ đến hạn hôm nay",
    href: "/review",
    icon: GraduationCap,
    iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Đọc hiểu song ngữ",
    description: "Tra từ trực tiếp trong ngữ cảnh",
    href: "/reading",
    icon: BookOpen,
    iconColor: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Kho từ & Trợ lý AI",
    description: "Quản lý toàn bộ từ vựng đã lưu",
    href: "/vocabulary-management",
    icon: BookA,
    iconColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
] as const;

const EMPTY_FORECAST: UpcomingReviewSummary = {
  total: 0,
  busiestDay: null,
  averagePerDay: 0,
  days: [],
};

export function DashboardOverview({
  displayName,
  stats,
  recentSets = [],
  forecast = EMPTY_FORECAST,
}: DashboardOverviewProps) {
  return (
    <PageContainer className="space-y-6">
      <WelcomeSection
        displayName={displayName}
        dueToday={stats.todayReviewCount}
        recentSet={recentSets[0] ?? null}
        streak={stats.streak}
      />

      {/* Quick Actions Bar */}
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4 sm:gap-3">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs transition-all duration-150 hover:border-primary/35 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div
                className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border ${item.iconColor}`}
              >
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate hidden lg:block mt-0.5">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Primary KPI Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DailyStreak streak={stats.streak} weeklyActivity={stats.weeklyActivity} />
        </div>
        <div className="lg:col-span-1">
          <LearningProgress
            progress={stats.dailyProgress}
            todaySummary={stats.todaySummary}
          />
        </div>
        <div className="lg:col-span-1">
          <VocabularyStatisticsCard stats={stats.dashboardVocabularyStats} />
        </div>
      </div>

      {/* Main Study & Review Workspace */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RecentVocabularySets sets={recentSets} />
        </div>
        <div className="lg:col-span-5">
          <TodayReview
            dueToday={stats.todayReviewCount}
            masteredWords={stats.masteredWords}
            learningWords={stats.learningWords}
            forecast={forecast}
          />
        </div>
      </div>
    </PageContainer>
  );
}
