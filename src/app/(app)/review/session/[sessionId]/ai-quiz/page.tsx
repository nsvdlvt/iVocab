import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionCard } from "@/components/common/SectionCard";
import { buttonVariants } from "@/components/ui/button";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionAiQuizPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await requireReviewSession(sessionId);

  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <SectionCard className="text-center space-y-4 p-8">
          <div className="mx-auto rounded-full bg-amber-500/10 p-4 w-fit text-amber-600 dark:text-amber-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">AI Quiz chỉ dùng cho bộ từ vựng</h1>
            <p className="text-sm text-muted-foreground">
              Chế độ AI Quiz hiện được thiết kế cho trang bộ từ vựng để lấy đúng SRS metadata và ưu tiên các từ yếu hơn.
            </p>
          </div>
          <Link
            href={`/review/session/${session.id}`}
            className={buttonVariants({
              className: "rounded-xl gap-2",
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại bộ từ vựng
          </Link>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
