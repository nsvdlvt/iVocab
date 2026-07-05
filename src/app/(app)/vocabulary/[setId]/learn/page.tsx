import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { LearnViewer } from "@/components/features/learn/LearnViewer";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const set = await VocabSetRepository.getVocabSetById(setId, user.id);
  if (!set || set.deleted_at) {
    notFound();
  }

  const words = await VocabularyRepository.getWordsForStudy(setId, user.id);

  return (
    <PageContainer className="py-6 sm:py-8">
      <LearnViewer
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/vocabulary/${setId}`);
        }}
      />
    </PageContainer>
  );
}
