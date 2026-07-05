import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { DictationViewer } from "@/components/features/dictation/DictationViewer";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function DictationPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [vocabSet, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    VocabularyRepository.getBySetId(setId, user.id),
  ]);

  if (!vocabSet) {
    notFound();
  }

  return (
    <PageContainer className="pt-2 md:pt-4">
      <DictationViewer
        initialWords={words}
        setInfo={{ id: vocabSet.id, title: vocabSet.title }}
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/vocabulary/${setId}`);
        }}
      />
    </PageContainer>
  );
}
