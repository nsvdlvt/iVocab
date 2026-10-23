import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { AiQuizClient } from "@/components/features/ai-quiz/AiQuizClient";

import type { Metadata } from "next";
import { getVocabSetMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const title = await getVocabSetMetadataTitle(setId, "AI Quiz");
  return { title };
}

export default async function AiQuizPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const set = await VocabSetRepository.getVocabSetById(setId, user.id);
  if (!set || set.deleted_at) {
    notFound();
  }

  return (
    <PageContainer className="py-6 sm:py-8">
      <AiQuizClient setId={set.id} setTitle={set.title} />
    </PageContainer>
  );
}
