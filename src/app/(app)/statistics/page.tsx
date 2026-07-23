import React from "react";
import { CheckCircle2, GraduationCap, Clock, Flame, BookOpen, Library, BarChart3, PieChart } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { requireUser } from "@/lib/auth/require-user";
import { StatisticsRepository } from "@/repositories/statistics.repository";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const profile = await requireUser();
  const [{ stats, totalSets }, vocabularyStats] = await Promise.all([
    StatisticsRepository.getStatisticsPageData(profile.id),
    VocabularyStatsService.getUserVocabularyStats(profile.id),
  ]);

  const learnedWords = stats?.learned_words ?? 0;
  const reviewCount = stats?.review_count ?? 0;
  const streak = profile.streak ?? 0;
  const studyTime = stats?.total_study_time ?? 0;
  const totalWords = vocabularyStats.totalWords;

  const hasAnyData = totalWords > 0 || totalSets > 0;

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <PageHeader
        title="Thống kê học tập"
        description="Theo dõi chi tiết số từ vựng tích lũy, thời gian ôn tập và hiệu suất bài kiểm tra."
      />

      {/* Summary Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Bộ từ vựng"
          value={totalSets}
          description="Bộ học đã tạo"
          icon={Library}
          iconClassName="text-blue-500 bg-blue-500/10"
        />
        <StatCard
          title="Tổng từ vựng"
          value={totalWords}
          description="Từ trong kho học"
          icon={BookOpen}
          iconClassName="text-violet-500 bg-violet-500/10"
        />
        <StatCard
          title="Từ đã thuộc"
          value={learnedWords}
          description="Đã ghi nhớ sâu"
          icon={CheckCircle2}
          iconClassName="text-emerald-500 bg-emerald-500/10"
        />
        <StatCard
          title="Số lần ôn tập"
          value={reviewCount}
          description="Phiên ôn tập tổng"
          icon={GraduationCap}
          iconClassName="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          title="Chuỗi học tập"
          value={`${streak} ngày`}
          description="Streak hiện tại"
          icon={Flame}
          iconClassName="text-orange-500 bg-orange-500/10"
        />
        <StatCard
          title="Thời gian học"
          value={studyTime > 0 ? `${studyTime} phút` : "0 phút"}
          description="Tổng thời gian học"
          icon={Clock}
          iconClassName="text-sky-500 bg-sky-500/10"
        />
      </div>

      {/* Chart containers */}
      {hasAnyData ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard className="flex flex-col h-80 justify-between">
            <SectionHeader
              title="Thời gian học trong tuần"
              description="Số phút học tập tích lũy theo từng ngày"
            />
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 my-4 text-center p-6">
              <BarChart3 className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <span className="text-sm font-semibold text-foreground">Biểu đồ thời gian học</span>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Recharts BarChart sẽ được tích hợp tại đây ở phase tiếp theo.
              </p>
            </div>
          </SectionCard>

          <SectionCard className="flex flex-col h-80 justify-between">
            <SectionHeader
              title="Phân bổ trạng thái từ vựng"
              description="Tỉ lệ từ mới, đang học và đã thuộc"
            />
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 my-4 text-center p-6">
              <PieChart className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <span className="text-sm font-semibold text-foreground">Biểu đồ phân bổ trạng thái</span>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Recharts PieChart sẽ được tích hợp tại đây ở phase tiếp theo.
              </p>
            </div>
          </SectionCard>
        </div>
      ) : (
        /* Full empty state when no data at all */
        <SectionCard className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="rounded-full bg-muted/60 p-5">
            <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Chưa có dữ liệu thống kê</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Hãy tạo bộ từ vựng, thêm từ và bắt đầu học để thống kê xuất hiện tại đây.
            </p>
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
