import { StatCard } from "@/components/admin/cards/stat-card";
import { Users } from "lucide-react";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { Suspense } from "react";

async function UserStatsData() {
  let total = 0;
  let isError = false;
  try {
    total = await AdminDashboardRepository.getTotalUsers();
  } catch (_error) {
    isError = true;
  }
  
  if (isError) {
    return <StatCard title="Total Users" icon={Users} isError />;
  }
  return <StatCard title="Total Users" icon={Users} value={total.toLocaleString()} />;
}

export function UserStatsWidget() {
  return (
    <Suspense fallback={<StatCard title="Total Users" icon={Users} isLoading />}>
      <UserStatsData />
    </Suspense>
  );
}
