import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LearnViewer } from "@/components/features/learn/LearnViewer";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function SharedLearnPage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
  ]);

  if (!set) return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;

  return (
    <PageContainer className="py-6 sm:py-8">
      <LearnViewer
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/share/${setId}`);
        }}
      />
    </PageContainer>
  );
}
