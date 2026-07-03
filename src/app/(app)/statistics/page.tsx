"use client";

import React from "react";
import { CheckCircle2, GraduationCap, Clock, Trophy, BarChart3, PieChart } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { mockLearningStats } from "@/mock/statistics";

export default function StatisticsPage() {
  const stats = mockLearningStats;

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <PageHeader
        title="Thống kê học tập"
        description="Theo dõi chi tiết số từ vựng tích lũy, thời gian ôn tập và hiệu suất bài kiểm tra."
      />

      {/* Summary Stats Row using reusable StatCard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Từ đã thuộc"
          value={stats.totalWordsLearned}
          description="Đã ghi nhớ sâu"
          icon={CheckCircle2}
          iconClassName="text-emerald-500 bg-emerald-500/10"
          trend={{ value: "+12 từ mới tuần này", isPositive: true }}
        />
        <StatCard
          title="Từ đang học"
          value={stats.totalWordsReviewing}
          description="Cần ôn tập hàng ngày"
          icon={GraduationCap}
          iconClassName="text-violet-500 bg-violet-500/10"
        />
        <StatCard
          title="Thời gian học"
          value={`${stats.totalStudyMinutes} phút`}
          description="Thời gian học tập"
          icon={Clock}
          iconClassName="text-blue-500 bg-blue-500/10"
          trend={{ value: "+45 phút hôm nay", isPositive: true }}
        />
        <StatCard
          title="Hiệu suất thi"
          value={`${stats.averageQuizScore}%`}
          description="Tỉ lệ làm quiz đúng"
          icon={Trophy}
          iconClassName="text-amber-500 bg-amber-500/10"
        />
      </div>

      {/* Chart Containers designed for future Recharts integration */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly time block */}
        <SectionCard className="flex flex-col h-96 justify-between">
          <SectionHeader
            title="Thời gian học trong tuần"
            description="Số phút học tập tích lũy theo từng ngày"
          />
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 my-4 text-center p-6">
            <BarChart3 className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <span className="text-sm font-semibold text-foreground">Khu vực tích hợp biểu đồ thời gian học</span>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
              Container đã được thiết kế sẵn sàng để tích hợp thư viện **Recharts** (BarChart) biểu diễn dữ liệu thời gian học tập trong tuần.
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Biểu đồ cột (Bar Chart) • Nguồn dữ liệu: `mockDailyLearningTime`
          </div>
        </SectionCard>

        {/* Word distribution block */}
        <SectionCard className="flex flex-col h-96 justify-between">
          <SectionHeader
            title="Phân bổ trạng thái từ vựng"
            description="Tỉ lệ từ mới, đang học và đã thuộc"
          />
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 my-4 text-center p-6">
            <PieChart className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <span className="text-sm font-semibold text-foreground">Khu vực tích hợp biểu đồ phân bổ trạng thái</span>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
              Container đã được thiết kế sẵn sàng để tích hợp thư viện **Recharts** (PieChart) biểu diễn tỉ lệ phân bổ trạng thái học tập.
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Biểu đồ tròn (Pie Chart) • Nguồn dữ liệu: `mockVocabularyDistribution`
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
