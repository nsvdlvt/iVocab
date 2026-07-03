import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, GraduationCap, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { WordTable } from "@/components/features/vocabulary/WordTable";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function VocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const set = await VocabSetRepository.getVocabSetById(setId, user.id);
  if (!set || set.deleted_at) {
    notFound();
  }

  const words = await VocabularyRepository.getBySetId(setId, user.id);

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
    <Link
      href={ROUTES.REVIEW}
      className={buttonVariants({
        variant: "default",
        className: "rounded-xl gap-2 cursor-pointer shadow-sm inline-flex items-center",
      })}
    >
      <GraduationCap className="h-4 w-4" />
      Bắt đầu ôn tập
    </Link>
  );

  return (
    <PageContainer className="space-y-6">
      <div>{backButton}</div>

      <PageHeader
        title={set.title}
        description={set.description ?? ""}
        action={startReviewButton}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Danh sách từ vựng ({words.length} từ)
        </h2>
        {words.length > 0 ? (
          <WordTable words={words} />
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
