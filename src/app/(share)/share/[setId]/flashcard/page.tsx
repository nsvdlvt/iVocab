import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardViewer } from "@/components/features/flashcard/FlashcardViewer";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function SharedFlashcardPage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
  ]);

  if (!set) return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;

  return (
    <PageContainer className="py-6 sm:py-8">
      <FlashcardViewer
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        readOnly
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/share/${setId}`);
        }}
      />
    </PageContainer>
  );
}
