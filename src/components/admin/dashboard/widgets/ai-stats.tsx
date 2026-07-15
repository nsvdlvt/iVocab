import { StatCard } from "@/components/admin/cards/stat-card";
import { Bot } from "lucide-react";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { Suspense } from "react";

async function AiStatsData() {
  let stats = { total: 0, cost: 0 };
  let isError = false;
  try {
    stats = await AdminDashboardRepository.getAiRequestsToday();
  } catch (_error) {
    isError = true;
  }
  
  if (isError) {
    return <StatCard title="AI Requests Today" icon={Bot} isError />;
  }
  return <StatCard title="AI Requests Today" icon={Bot} value={stats.total.toLocaleString()} description={`Est. Cost: $${stats.cost}`} />;
}

export function AiStatsWidget() {
  return (
    <Suspense fallback={<StatCard title="AI Requests Today" icon={Bot} isLoading />}>
      <AiStatsData />
    </Suspense>
  );
}
