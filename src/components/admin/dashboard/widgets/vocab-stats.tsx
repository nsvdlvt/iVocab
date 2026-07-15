import { StatCard } from "@/components/admin/cards/stat-card";
import { Library } from "lucide-react";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { Suspense } from "react";

async function VocabStatsData() {
  let total = 0;
  let isError = false;
  try {
    total = await AdminDashboardRepository.getTotalVocabularySets();
  } catch (_error) {
    isError = true;
  }
  
  if (isError) {
    return <StatCard title="Vocabulary Sets" icon={Library} isError />;
  }
  return <StatCard title="Vocabulary Sets" icon={Library} value={total.toLocaleString()} />;
}

export function VocabStatsWidget() {
  return (
    <Suspense fallback={<StatCard title="Vocabulary Sets" icon={Library} isLoading />}>
      <VocabStatsData />
    </Suspense>
  );
}
