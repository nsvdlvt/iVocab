import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeSection } from "@/components/features/dashboard/WelcomeSection";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { VocabularyStatisticsCard } from "@/components/features/dashboard/VocabularyStatisticsCard";
import { DashboardStats } from "@/repositories/statistics.repository";

interface DashboardOverviewProps {
  displayName: string;
  stats: DashboardStats;
}

export function DashboardOverview({
  displayName,
  stats,
}: DashboardOverviewProps) {
  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <WelcomeSection displayName={displayName} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DailyStreak streak={stats.streak} weeklyActivity={stats.weeklyActivity} />
        </div>
        <div className="lg:col-span-1">
          <LearningProgress progress={stats.dailyProgress} />
        </div>
        <div className="lg:col-span-1">
          <VocabularyStatisticsCard stats={stats.dashboardVocabularyStats} />
        </div>
      </div>
    </PageContainer>
  );
}
