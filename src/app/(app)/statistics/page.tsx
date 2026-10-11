import React from "react";
import { CheckCircle2, GraduationCap, Clock, Flame, BookOpen, Library, BarChart3 } from "lucide-react";
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

      {/* Analytics breakdown containers */}
      {hasAnyData ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard className="flex flex-col justify-between space-y-5">
            <SectionHeader
              title="Phân bổ mức độ ghi nhớ"
              description="Tỉ lệ từ đã thuộc và từ đang trong lộ trình ôn tập"
            />
            <div className="space-y-4 py-2">
              {(() => {
                const masteredPct = totalWords > 0 ? Math.min(100, Math.round((learnedWords / totalWords) * 100)) : 0;
                const inProgressWords = Math.max(0, totalWords - learnedWords);
                const inProgressPct = totalWords > 0 ? 100 - masteredPct : 0;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          Đã ghi nhớ sâu
                        </span>
                        <span className="font-bold text-foreground tabular-nums">
                          {learnedWords} từ ({masteredPct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${masteredPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          Đang học & Cần ôn tập
                        </span>
                        <span className="font-bold text-foreground tabular-nums">
                          {inProgressWords} từ ({inProgressPct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${inProgressPct}%` }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Tổng số bộ từ vựng đang quản lý</span>
              <span className="font-bold text-foreground tabular-nums">{totalSets} bộ</span>
            </div>
          </SectionCard>

          <SectionCard className="flex flex-col justify-between space-y-5">
            <SectionHeader
              title="Hiệu suất & Thói quen học tập"
              description="Tổng hợp nhịp độ rèn luyện tích lũy của bạn"
            />
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Trung bình mỗi bộ</span>
                <p className="text-xl font-black text-foreground tabular-nums">
                  {totalSets > 0 ? Math.round(totalWords / totalSets) : 0} từ
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Tổng lượt ôn tập</span>
                <p className="text-xl font-black text-foreground tabular-nums">{reviewCount} lượt</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Thời gian tích lũy</span>
                <p className="text-xl font-black text-foreground tabular-nums">{studyTime} phút</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Chuỗi duy trì</span>
                <p className="text-xl font-black text-orange-600 dark:text-orange-400 tabular-nums">{streak} ngày</p>
              </div>
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
