import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BookOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { AdaptiveLearningFlow } from "@/components/features/learn/AdaptiveLearningFlow";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { getVocabSetMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const title = await getVocabSetMetadataTitle(setId, "Học từ vựng thích ứng");
  return { title };
}

export default async function LearnPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    ReviewRepository.getBySetId(user.id, setId),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  // Gracefully handle sets with zero words
  if (words.length === 0) {
    return (
      <PageContainer className="py-12">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-lg font-bold text-foreground">
              Bộ từ vựng chưa có từ nào
            </h2>
            <p className="text-xs text-muted-foreground">
              Bộ từ &ldquo;{set.title}&rdquo; hiện chưa có từ vựng nào để bắt đầu phiên học thích ứng.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={ROUTES.VOCABULARY_DETAIL(setId)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl gap-1.5 text-xs"
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Quay lại chi tiết bộ từ</span>
            </Link>
            <Link
              href={`/vocabulary/${setId}/edit`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl gap-1.5 text-xs font-semibold"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm từ vựng ngay</span>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 sm:py-8">
      <AdaptiveLearningFlow
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBackHref={ROUTES.VOCABULARY_DETAIL(setId)}
      />
    </PageContainer>
  );
}
