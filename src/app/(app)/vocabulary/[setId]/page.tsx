import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { WordTable } from "@/components/features/vocabulary/WordTable";
import { StudyModes } from "@/components/features/vocabulary/StudyModes";
import { StartReviewDialog } from "@/components/features/review/StartReviewDialog";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";
export default async function VocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    VocabularyRepository.getBySetId(setId, user.id),
  ]);
  const wordsWithReview = await ReviewRepository.getBySetId(user.id, setId);

  if (!set || set.deleted_at) {
    notFound();
  }

  const backButton = (
    <Link
      href={ROUTES.VOCABULARY}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "-ml-3 gap-1 rounded-xl cursor-pointer inline-flex items-center",
      })}
    >
      <ChevronLeft className="h-4 w-4" />
      Quay lại danh sách bộ từ
    </Link>
  );

  const startReviewButton = (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/vocabulary/${setId}/edit`}
        className={buttonVariants({
          variant: "outline",
          className: "rounded-xl gap-2 cursor-pointer shadow-xs inline-flex items-center",
        })}
      >
        Chỉnh sửa bộ thẻ
      </Link>

      <StartReviewDialog vocabularySetId={setId} />
    </div>
  );

  return (
    <PageContainer className="space-y-6">
      <div>{backButton}</div>

      <PageHeader
        title={set.title}
        description={set.description ?? ""}
        action={startReviewButton}
      />

      <StudyModes setId={setId} />

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Danh sách từ vựng ({words.length} từ)
        </h2>
        {words.length > 0 ? (
          <WordTable words={wordsWithReview} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-14 border border-dashed rounded-2xl bg-muted/5 gap-3">
            <div className="rounded-full bg-muted/60 p-3">
              <BookOpen className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Bộ từ vựng chưa có từ nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy chỉnh sửa bộ từ và thêm từ vựng đầu tiên.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
