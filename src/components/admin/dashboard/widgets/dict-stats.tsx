import { StatCard } from "@/components/admin/cards/stat-card";
import { BookOpenText } from "lucide-react";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { Suspense } from "react";

async function DictStatsData() {
  let rate = 0;
  let isError = false;
  try {
    rate = await AdminDashboardRepository.getDictCacheHitRate();
  } catch (_error) {
    isError = true;
  }
  
  if (isError) {
    return <StatCard title="Dict. Cache Hit" icon={BookOpenText} isError />;
  }
  return <StatCard title="Dict. Cache Hit" icon={BookOpenText} value={`${rate}%`} description="Last 24 hours" />;
}

export function DictStatsWidget() {
  return (
    <Suspense fallback={<StatCard title="Dict. Cache Hit" icon={BookOpenText} isLoading />}>
      <DictStatsData />
    </Suspense>
  );
}
