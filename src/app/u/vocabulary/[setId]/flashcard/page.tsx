import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardStudy } from "@/components/features/flashcard/FlashcardStudy";


import type { Metadata } from "next";
import { getVocabSetMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const title = await getVocabSetMetadataTitle(setId, "Flashcard");
  return { title };
}

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
        onBackHref={`/u/vocabulary/${setId}`}
      />
    </PageContainer>
  );
}
