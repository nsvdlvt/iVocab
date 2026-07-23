import React from "react";
import { GraduationCap } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { UpcomingReviewsForecast } from "@/components/features/review/UpcomingReviewsForecast";
import { StartReviewButton } from "@/components/features/review/StartReviewButton";
import { requireUser } from "@/lib/auth/require-user";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const stats = await VocabularyStatsService.getUserVocabularyStats(user.id);

  return (
    <PageContainer className="max-w-5xl space-y-6 md:space-y-8">
      <PageHeader
        title="Ôn tập hôm nay"
        description="Chỉ tải những từ đang đến hạn vào hàng đợi ôn tập."
        action={<StartReviewButton />}
      />

      <UpcomingReviewsForecast forecast={stats.forecast} />

      <div className="rounded-3xl border bg-card p-8 shadow-sm text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-5">
            <GraduationCap className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Tổng số từ đang chờ ôn: <span className="font-bold text-foreground">{stats.dueToday}</span>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
