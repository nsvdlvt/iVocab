"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { mockReviewWords } from "@/mock/review";
import { ROUTES } from "@/constants/routes";

export function TodayReview() {
  const count = mockReviewWords.length;

  return (
    <SectionCard className="flex flex-col h-full justify-between">
      <div>
        <SectionHeader
          title="Ôn tập hôm nay"
          description="Củng cố các từ vựng cũ"
        />
        <div className="my-5 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-primary">{count}</span>
          <span className="text-sm font-medium text-muted-foreground">từ cần ôn tập</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Hệ thống tự động đề xuất các từ vựng cần ôn lại giúp tối ưu hóa khả năng ghi nhớ dài hạn của bạn.
        </p>
      </div>
      <Link
        href={ROUTES.REVIEW}
        className={buttonVariants({
          variant: "default",
          className: "w-full rounded-xl gap-2 cursor-pointer shadow-sm inline-flex items-center justify-center h-10",
        })}
      >
        <GraduationCap className="h-4 w-4" />
        Bắt đầu ôn tập
      </Link>
    </SectionCard>
  );
}
