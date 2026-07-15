import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { AiQuizClient } from "@/components/features/ai-quiz/AiQuizClient";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

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
