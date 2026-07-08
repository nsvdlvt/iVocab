import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ROUTES } from "@/constants/routes";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { UpcomingReviewsForecast } from "../review/UpcomingReviewsForecast";

interface TodayReviewProps {
  dueToday: number;
  masteredWords: number;
  learningWords: number;
  forecast: UpcomingReviewSummary;
}

export function TodayReview({ dueToday, masteredWords, learningWords, forecast }: TodayReviewProps) {
  return (
    <SectionCard className="flex flex-col h-full justify-between space-y-4">
      <div>
        <SectionHeader title="Ôn tập hôm nay" description="Dữ liệu lấy từ SRS hiện có" />
        <div className="my-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-muted/20 px-3 py-4">
            <div className="text-3xl font-extrabold text-primary">{dueToday}</div>
            <div className="text-xs text-muted-foreground">Cần ôn</div>
          </div>
          <div className="rounded-xl border bg-muted/20 px-3 py-4">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{masteredWords}</div>
            <div className="text-xs text-muted-foreground">Thuộc</div>
          </div>
          <div className="rounded-xl border bg-muted/20 px-3 py-4">
            <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{learningWords}</div>
            <div className="text-xs text-muted-foreground">Đang học</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {dueToday > 0
            ? "Bấm Bắt đầu ôn để làm các từ đang đến hạn ngay bây giờ."
            : "🎉 Tuyệt vời! Bạn đã hoàn thành hết các bài ôn đã lên lịch hôm nay."}
        </p>
        <UpcomingReviewsForecast forecast={forecast} />
      </div>
      <Link
        href={ROUTES.REVIEW}
        className={buttonVariants({
          variant: dueToday > 0 ? "default" : "outline",
          className: "w-full rounded-xl gap-2 cursor-pointer shadow-sm inline-flex items-center justify-center h-10",
        })}
      >
        <GraduationCap className="h-4 w-4" />
        {dueToday > 0 ? "Bắt đầu ôn" : "Mở trang ôn"}
      </Link>
    </SectionCard>
  );
}
