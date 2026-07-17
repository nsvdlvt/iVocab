import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { DashboardOverview } from "./DashboardOverview";

export const dynamic = "force-dynamic";

export async function DashboardPageContent() {
  const profile = await requireUser();
  const userId = profile.id;

  const [stats, recentSets, reviewForecast] = await Promise.all([
    StatisticsRepository.getDashboardStats(userId),
    VocabSetRepository.getRecentVocabSets(userId, 2),
    ReviewRepository.getUpcomingReviewForecast(userId),
  ]);

  return (
    <DashboardOverview
      displayName={profile.display_name ?? "Học viên"}
      stats={stats}
      recentSets={recentSets}
      reviewForecast={reviewForecast}
    />
  );
}
