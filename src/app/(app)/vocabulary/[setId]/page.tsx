import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { WordTable } from "@/components/features/vocabulary/WordTable";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set";
import { ROUTES } from "@/constants/routes";
import { VocabularyWord } from "@/types/vocabulary";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function VocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const set = await VocabSetRepository.getVocabSetById(setId, user.id);
  if (!set || set.deleted_at) {
    notFound();
  }

  const words = await VocabSetRepository.getVocabularyItems(setId, user.id);

  const mappedWords: VocabularyWord[] = words.map((w) => ({
    id: w.id,
    word: w.word,
    ipa: w.ipa || "",
    partOfSpeech: (w.part_of_speech || "noun") as VocabularyWord["partOfSpeech"],
    definition: w.meaning,
    example: w.example || "",
    exampleTranslation: w.example_translation || "",
    status: "new" as const,
  }));

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
        description={set.description || ""}
        action={startReviewButton}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Danh sách từ vựng ({mappedWords.length} từ)
        </h2>
        {mappedWords.length > 0 ? (
          <WordTable words={mappedWords} />
        ) : (
          <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground text-xs bg-muted/5">
            Bộ từ vựng này hiện chưa có từ nào.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
