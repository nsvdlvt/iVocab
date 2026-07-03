import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeSection } from "@/components/features/dashboard/WelcomeSection";
import { TodayReview } from "@/components/features/dashboard/TodayReview";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { RecentVocabularySets } from "@/components/features/dashboard/RecentVocabularySets";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <PageContainer className="space-y-6 md:space-y-8">
      {/* Welcome Message */}
      <WelcomeSection />

      {/* Key stats row: Streak, Progress, and Today's Review */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DailyStreak />
        <LearningProgress />
        <TodayReview />
      </div>

      {/* Main sections: Recent Vocab Sets on the left, Activity Timeline on the right */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentVocabularySets />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </PageContainer>
  );
}
