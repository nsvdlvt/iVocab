import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ROUTES } from "@/constants/routes";

interface TodayReviewProps {
  reviewCount: number;
}

export function TodayReview({ reviewCount }: TodayReviewProps) {
  return (
    <SectionCard className="flex flex-col h-full justify-between">
      <div>
        <SectionHeader
          title="Ôn tập hôm nay"
          description="Củng cố các từ vựng cũ"
        />
        <div className="my-5 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-primary">{reviewCount}</span>
          <span className="text-sm font-medium text-muted-foreground">từ cần ôn tập</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          {reviewCount > 0
            ? "Hệ thống tự động đề xuất các từ vựng cần ôn lại giúp tối ưu hóa khả năng ghi nhớ dài hạn của bạn."
            : "Bạn chưa có từ vựng cần ôn tập hôm nay. Hãy tiếp tục học thêm từ mới!"}
        </p>
      </div>
      <Link
        href={ROUTES.REVIEW}
        className={buttonVariants({
          variant: reviewCount > 0 ? "default" : "outline",
          className: "w-full rounded-xl gap-2 cursor-pointer shadow-sm inline-flex items-center justify-center h-10",
        })}
      >
        <GraduationCap className="h-4 w-4" />
        {reviewCount > 0 ? "Bắt đầu ôn tập" : "Xem trang ôn tập"}
      </Link>
    </SectionCard>
  );
}
