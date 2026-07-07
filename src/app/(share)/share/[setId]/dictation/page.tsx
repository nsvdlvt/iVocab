import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DictationViewer } from "@/components/features/dictation/DictationViewer";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function SharedDictationPage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
  ]);

  if (!set) return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;

  return (
    <PageContainer className="pt-2 md:pt-4">
      <DictationViewer
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
