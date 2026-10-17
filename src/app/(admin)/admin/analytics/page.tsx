import type { Metadata } from "next";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { AnalyticsClient } from "@/components/admin/analytics/analytics-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Báo cáo & Phân tích Nâng cao | Vocabee Admin",
  description: "Báo cáo phân tích tăng trưởng người dùng, từ vựng, mức độ chuyên cần học tập và xuất dữ liệu báo cáo.",
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [metrics, userGrowth, vocabGrowth, studyActivity] = await Promise.all([
    AdminDashboardRepository.getOverviewMetrics(),
    AdminDashboardRepository.getUserGrowthData(14),
    AdminDashboardRepository.getVocabGrowthData(14),
    AdminDashboardRepository.getStudyActivityData(14),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Báo cáo & Phân tích Dữ liệu (Analytics)
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi chỉ số tăng trưởng người học, kho từ vựng và xuất báo cáo CSV định dạng chuẩn.
          </p>
        </div>
      </div>

      <AnalyticsClient
        metrics={metrics}
        userGrowth={userGrowth}
        vocabGrowth={vocabGrowth}
        studyActivity={studyActivity}
      />
    </div>
  );
}
