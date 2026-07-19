import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardStudy } from "@/components/features/flashcard/FlashcardStudy";


interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function FlashcardPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    ReviewRepository.getBySetId(user.id, setId),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  return (
    <PageContainer className="overflow-x-hidden py-6 sm:py-8">
      <FlashcardStudy
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBackHref={`/vocabulary/${setId}`}
      />
    </PageContainer>
  );
}
