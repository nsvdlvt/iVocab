import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ôn tập thông minh",
  description: "Lên lịch ôn tập từ vựng bằng thuật toán lặp lại ngắt quãng SRS tối ưu.",
};
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers,
  Medal,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { UpcomingReviewsForecast } from "@/components/features/review/UpcomingReviewsForecast";
import { StartReviewButton } from "@/components/features/review/StartReviewButton";
import { requireUser } from "@/lib/auth/require-user";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const stats = await VocabularyStatsService.getUserVocabularyStats(user.id);

  const todayDateStr = stats.forecast.days.find((d) => d.isToday)?.date;
  const duePreviewWords = stats.rows
    .filter((row) => {
      if (!row.review?.next_review || !todayDateStr) return false;
      return row.review.next_review.slice(0, 10) <= todayDateStr;
    })
    .slice(0, 9);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Trung tâm ôn tập SRS"
        description="Lặp lại ngắt quãng theo lịch trình thông minh giúp chuyển từ vựng vào trí nhớ dài hạn."
        action={<StartReviewButton dueCount={stats.dueToday} />}
      />

      {/* KPI Summary Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cần ôn hôm nay"
          value={stats.dueToday}
          description={
            stats.overdue > 0
              ? `Bao gồm ${stats.overdue} từ quá hạn`
              : "Đến hạn trong ngày"
          }
          icon={Clock3}
          iconClassName="text-primary bg-primary/10"
        />
        <StatCard
          title="Đang trong chu kỳ"
          value={stats.learningWords + stats.learnedWords}
          description={`${stats.learnedWords} từ đã ghi nhớ`}
          icon={Layers}
          iconClassName="text-sky-600 dark:text-sky-400 bg-sky-500/10"
        />
        <StatCard
          title="Đã thành thạo"
          value={stats.masteredWords}
          description="Đạt cấp độ SRS tối đa (Lv.5)"
          icon={Medal}
          iconClassName="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
        />
        <StatCard
          title="Từ mới chưa học"
          value={stats.newWords}
          description={`Trên tổng số ${stats.totalWords} từ`}
          icon={Sparkles}
          iconClassName="text-amber-600 dark:text-amber-400 bg-amber-500/10"
        />
      </div>

      {/* Main Call-to-Action & Forecast Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionCard className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  {stats.dueToday > 0 ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <Badge variant={stats.dueToday > 0 ? "warning" : "success"}>
                  {stats.dueToday > 0 ? "Sẵn sàng ôn tập" : "Hoàn tất hôm nay"}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">
                  {stats.dueToday > 0
                    ? `Bạn có ${stats.dueToday} từ vựng đến hạn ôn`
                    : "Tuyệt vời! Bạn đã hoàn thành hết lịch ôn hôm nay"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stats.dueToday > 0
                    ? "Mỗi phiên ôn tập kết hợp linh hoạt Flashcard, Trắc nghiệm, Nghe chép chính tả và Đặt câu AI để củng cố toàn diện."
                    : "Khi không có từ đến hạn, bạn có thể học thêm từ mới trong các bộ từ vựng hoặc luyện đọc hiểu song ngữ."}
                </p>
              </div>

              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Có <strong>{stats.overdue}</strong> từ đã quá hạn ôn tập cần được ưu tiên.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-border/60">
              <StartReviewButton dueCount={stats.dueToday} />
              <Link
                href="/vocabulary"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "justify-center"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span>Chọn theo bộ từ</span>
              </Link>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-7">
          <UpcomingReviewsForecast forecast={stats.forecast} />
        </div>
      </div>

      {/* Due Words Queue Preview */}
      {duePreviewWords.length > 0 && (
        <SectionCard className="space-y-4">
          <SectionHeader
            title="Từ vựng đang chờ trong hàng đợi"
            description="Một số từ vựng đến hạn sẽ xuất hiện trong phiên ôn tập tiếp theo của bạn"
            action={
              <Link
                href="/vocabulary-management?status=due"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Xem toàn bộ kho từ
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {duePreviewWords.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-muted/15 p-3.5 gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.word}
                    </p>
                    {item.ipa && (
                      <p className="text-xs font-mono text-muted-foreground">
                        {item.ipa}
                      </p>
                    )}
                  </div>
                  {item.review?.status && (
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {item.review.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
