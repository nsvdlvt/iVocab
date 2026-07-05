import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardViewer } from "@/components/features/flashcard/FlashcardViewer";


interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function FlashcardPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    VocabularyRepository.getWordsForStudy(setId, user.id),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  return (
    <PageContainer className="py-6 sm:py-8">
      <FlashcardViewer
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBack={async () => {
          "use server";
          // Redirecting via Next navigation inside server actions context 
          const { redirect } = await import("next/navigation");
          redirect(`/vocabulary/${setId}`);
        }}
      />
    </PageContainer>
  );
}
