import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { ReviewClient } from "@/components/features/review/ReviewClient";
import { requireUser } from "@/lib/auth/require-user";
import { ReviewRepository } from "@/repositories/review.repository";
import { GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const profile = await requireUser();
  const reviewItems = await ReviewRepository.getDueReviews(profile.id);
  const words = reviewItems.map((item) => item.vocabulary);

  return (
    <PageContainer className="max-w-4xl space-y-6 md:space-y-8">
      <PageHeader
        title="Ôn tập từ vựng"
        description="Ôn tập các từ vựng đến hạn hôm nay để ghi nhớ sâu sắc hơn."
      />

      {words.length === 0 ? (
        /* Empty State */
        <div className="max-w-xl mx-auto text-center py-16 space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-5">
              <GraduationCap className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Không có từ nào cần ôn tập!</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Tuyệt vời! Bạn đã ôn tập hết các từ đến hạn hôm nay.
              Hãy tiếp tục thêm từ mới và quay lại đây để ôn luyện.
            </p>
          </div>
          <Link
            href={ROUTES.VOCABULARY}
            className={buttonVariants({
              className: "rounded-xl cursor-pointer gap-2",
            })}
          >
            <BookOpen className="h-4 w-4" />
            Quản lý từ vựng
          </Link>
        </div>
      ) : (
        <ReviewClient words={words} />
      )}
    </PageContainer>
  );
}
