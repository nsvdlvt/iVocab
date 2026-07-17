import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeSection } from "@/components/features/dashboard/WelcomeSection";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { RecentVocabularySets } from "@/components/features/dashboard/RecentVocabularySets";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { UpcomingReviewsForecast } from "@/components/features/review/UpcomingReviewsForecast";
import { DashboardStats } from "@/repositories/statistics.repository";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { Database } from "@/types/database";

interface DashboardOverviewProps {
  displayName: string;
  stats: DashboardStats;
  reviewForecast: UpcomingReviewSummary;
  recentSets: Database["public"]["Tables"]["vocab_sets"]["Row"][];
}

export function DashboardOverview({
  displayName,
  stats,
  reviewForecast,
  recentSets,
}: DashboardOverviewProps) {
  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <WelcomeSection displayName={displayName} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DailyStreak streak={stats.streak} weeklyActivity={stats.weeklyActivity} />
        <LearningProgress progress={stats.dailyProgress} />
      </div>

      <UpcomingReviewsForecast forecast={reviewForecast} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentVocabularySets sets={recentSets} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </PageContainer>
  );
}
