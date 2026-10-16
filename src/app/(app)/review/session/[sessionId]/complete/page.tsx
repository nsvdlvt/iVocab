import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionCard } from "@/components/common/SectionCard";
import { MascotCelebration } from "@/components/mascot/MascotCelebration";
import { VocabeeMascot } from "@/components/common/VocabeeMascot";
import { requireUser } from "@/lib/auth/require-user";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";
import { getReviewSessionMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const title = await getReviewSessionMetadataTitle(sessionId, "Hoàn thành");
  return { title };
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
      <SectionCard className="relative overflow-hidden mx-auto max-w-lg p-8 sm:p-10 text-center space-y-6">
        <MascotCelebration active particleCount={48} />
        <div className="flex justify-center">
          <VocabeeMascot
            mood="celebrate"
            size="lg"
            speech="Tuyệt vời! Bạn vừa hoàn thành xuất sắc lượt ôn tập hôm nay! 🐝🎉"
            speechPosition="bottom"
          />
        </div>
        <div className="space-y-1.5 pt-2">
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
