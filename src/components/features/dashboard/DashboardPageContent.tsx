import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { DashboardOverview } from "./DashboardOverview";

export const dynamic = "force-dynamic";

export async function DashboardPageContent() {
  const profile = await requireUser();
  const userId = profile.id;

  const stats = await StatisticsRepository.getDashboardStats(userId);

  return (
    <DashboardOverview
      displayName={profile.display_name ?? "Học viên"}
      stats={stats}
    />
  );
}
