import type { Metadata } from "next";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { QuickActions } from "@/components/admin/dashboard/quick-actions";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { ActivityCenterWidget } from "@/components/admin/dashboard/widgets/activity-center";
import { SystemHealthWidget } from "@/components/admin/dashboard/widgets/system-health";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Tổng quan Quản trị | Vocabee Admin",
  description: "Bảng điều khiển quản trị hệ thống Vocabee với số liệu và báo cáo thời gian thực.",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [metrics, userGrowth, vocabGrowth, studyActivity] = await Promise.all([
    AdminDashboardRepository.getOverviewMetrics(),
    AdminDashboardRepository.getUserGrowthData(30),
    AdminDashboardRepository.getVocabGrowthData(30),
    AdminDashboardRepository.getStudyActivityData(30),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Bảng điều khiển Quản trị
          </h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan hiệu suất, nội dung và người dùng hệ thống Vocabee.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Hệ thống Hoạt động Bình thường
          </span>
        </div>
      </div>

      {/* Real KPI Metrics */}
      <KpiCards metrics={metrics} />

      {/* Quick Action Buttons */}
      <QuickActions />

      {/* Real Trend Charts */}
      <DashboardCharts
        userGrowth={userGrowth}
        vocabGrowth={vocabGrowth}
        studyActivity={studyActivity}
      />

      {/* Live Feeds: Activity + Health */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityCenterWidget />
        </div>
        <div className="lg:col-span-1">
          <SystemHealthWidget />
        </div>
      </div>
    </div>
  );
}
