import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardStudy } from "@/components/features/flashcard/FlashcardStudy";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function SharedFlashcardPage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
  ]);

  if (!set) return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;

  return (
    <PageContainer className="py-6 sm:py-8">
      <FlashcardStudy
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        readOnly
        onBackHref={`/share/${setId}`}
      />
    </PageContainer>
  );
}
