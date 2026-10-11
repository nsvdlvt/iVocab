import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionCard } from "@/components/common/SectionCard";
import { requireUser } from "@/lib/auth/require-user";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionCompletePage({ params }: PageProps) {
  const { sessionId } = await params;
  const user = await requireUser();
  const session = await ReviewSessionStore.get(sessionId);
  if (session?.vocabularySetId) {
    await VocabSetRepository.touchLastStudiedAt(session.vocabularySetId, user.id);
  }
  await ReviewSessionStore.delete(sessionId);

  return (
    <PageContainer className="py-12">
      <SectionCard className="mx-auto max-w-lg p-8 sm:p-10 text-center space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hoàn thành phiên ôn tập!
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tất cả từ vựng trong phiên ôn tập này đã được cập nhật lịch lặp lại ngắt quãng (SRS) mới.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/review"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Quay lại trung tâm ôn tập</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Home className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
