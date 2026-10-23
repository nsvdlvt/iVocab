import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, BookOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireETeamUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { AdaptiveLearningFlow } from "@/components/features/learn/AdaptiveLearningFlow";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  try {
    const profile = await requireETeamUser();
    const set = await VocabSetRepository.getVocabSetById(setId, profile.id);
    if (set?.title) {
      return {
        title: `Học: ${set.title} | E-Team Vocabee`,
        description: `Ôn luyện thích ứng thông minh bộ từ ${set.title}`,
      };
    }
  } catch {}
  return {
    title: "Học từ vựng thích ứng | E-Team",
  };
}

export default async function ETeamLearnFlowPage({ params }: PageProps) {
  const { setId } = await params;
  const profile = await requireETeamUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, profile.id),
    ReviewRepository.getBySetId(profile.id, setId),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  // Gracefully handle sets with zero words
  if (words.length === 0) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center shadow-2xs space-y-4">
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
              href={ROUTES.ETEAM_VOCAB_DETAIL(setId)}
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
                "rounded-xl gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm từ vựng ngay</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-4rem)]">
      <AdaptiveLearningFlow
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBackHref={ROUTES.ETEAM_VOCAB_DETAIL(setId)}
      />
    </div>
  );
}
