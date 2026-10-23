import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Plus, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import type { Database } from "@/types/database";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface WelcomeSectionProps {
  displayName: string;
  dueToday?: number;
  recentSet?: VocabSetRow | null;
  streak?: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const getFormattedToday = () => {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
};

export function WelcomeSection({
  displayName,
  dueToday = 0,
  recentSet = null,
}: WelcomeSectionProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[11px] font-medium capitalize">
              {getFormattedToday()}
            </Badge>
            {dueToday > 0 ? (
              <Badge variant="warning" className="text-[11px]">
                {dueToday} từ cần ôn hôm nay
              </Badge>
            ) : (
              <Badge variant="success" className="text-[11px]">
                Đã hoàn thành lịch ôn hôm nay
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <BeeMascot
              state={dueToday > 0 ? "reading" : "celebrating"}
              size="md"
              showAura
              interactive
              bubble={
                dueToday > 0
                  ? "Sẵn sàng ôn bài nào! 🐝"
                  : "Mục tiêu hôm nay đã hoàn thành! 🎉"
              }
              bubblePosition="right"
              className="shrink-0"
            />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {getGreeting()}, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                {dueToday > 0
                  ? `Bạn có ${dueToday} từ vựng đến hạn ôn tập theo chu kỳ ghi nhớ ngắt quãng (SRS). Hãy hoàn thành lượt ôn để củng cố trí nhớ dài hạn.`
                  : recentSet
                    ? `Tiếp tục rèn luyện bộ từ "${recentSet.title}" hoặc khám phá bài đọc song ngữ mới hôm nay.`
                    : "Bắt đầu hành trình chinh phục từ vựng tiếng Anh thông minh với Flashcard, SRS và trợ lý AI."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {dueToday > 0 ? (
            <>
              <Link
                href={ROUTES.REVIEW}
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Ôn tập ngay ({dueToday})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              {recentSet && (
                <Link
                  href={ROUTES.VOCABULARY_DETAIL(recentSet.id)}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="max-w-[180px] truncate">Học tiếp: {recentSet.title}</span>
                </Link>
              )}
            </>
          ) : recentSet ? (
            <>
              <Link
                href={ROUTES.VOCABULARY_DETAIL(recentSet.id)}
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                <Sparkles className="h-4 w-4" />
                <span className="max-w-[200px] truncate">Học tiếp: {recentSet.title}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/u/vocabulary/new"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bộ từ mới</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/u/vocabulary/new"
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bộ từ đầu tiên</span>
              </Link>
              <Link
                href={ROUTES.READING}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <BookOpen className="h-4 w-4" />
                <span>Đọc song ngữ</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
