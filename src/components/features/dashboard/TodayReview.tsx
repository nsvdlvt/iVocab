import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { UpcomingReviewsForecast } from "../review/UpcomingReviewsForecast";
import { cn } from "@/lib/utils";

interface TodayReviewProps {
  dueToday: number;
  masteredWords: number;
  learningWords: number;
  forecast: UpcomingReviewSummary;
}

export function TodayReview({
  dueToday,
  masteredWords,
  learningWords,
  forecast,
}: TodayReviewProps) {
  return (
    <SectionCard className="flex flex-col h-full justify-between gap-5">
      <div className="space-y-4">
        <SectionHeader
          title="Hàng đợi ôn tập SRS"
          description="Lặp lại ngắt quãng tối ưu hóa trí nhớ dài hạn"
          className="mb-0"
          action={
            <Badge variant={dueToday > 0 ? "warning" : "success"}>
              {dueToday > 0 ? `${dueToday} đến hạn` : "Hoàn tất"}
            </Badge>
          }
        />

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-primary">
              {dueToday}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
              Cần ôn
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {learningWords}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
              Đang học
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {masteredWords}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
              Thành thạo
            </div>
          </div>
        </div>

        <UpcomingReviewsForecast forecast={forecast} compact />
      </div>

      <Link
        href={ROUTES.REVIEW}
        className={cn(
          buttonVariants({
            variant: dueToday > 0 ? "default" : "outline",
            size: "lg",
          }),
          "w-full justify-center"
        )}
      >
        <GraduationCap className="h-4 w-4" />
        <span>{dueToday > 0 ? `Bắt đầu ôn tập (${dueToday} từ)` : "Mở trung tâm ôn tập SRS"}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </SectionCard>
  );
}
