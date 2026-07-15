import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeSection } from "@/components/features/dashboard/WelcomeSection";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { RecentVocabularySets } from "@/components/features/dashboard/RecentVocabularySets";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { requireUser } from "@/lib/auth/require-user";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { UpcomingReviewsForecast } from "@/components/features/review/UpcomingReviewsForecast";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireUser();
  const userId = profile.id;

  const [stats, recentSets, reviewForecast] = await Promise.all([
    StatisticsRepository.getDashboardStats(userId),
    VocabSetRepository.getRecentVocabSets(userId, 2),
    ReviewRepository.getUpcomingReviewForecast(userId),
  ]);

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      {/* Welcome Message */}
      <WelcomeSection displayName={profile.display_name ?? "Học viên"} />

      {/* Key stats row: Streak, Progress, and Today's Review */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DailyStreak streak={stats.streak} weeklyActivity={stats.weeklyActivity} />
        <LearningProgress progress={stats.dailyProgress} />
      </div>

      <UpcomingReviewsForecast forecast={reviewForecast} />

      {/* Main sections: Recent Vocab Sets on the left, Activity Timeline on the right */}
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
