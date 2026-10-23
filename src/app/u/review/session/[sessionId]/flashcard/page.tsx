import React from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ReviewFlashcardSession } from "@/components/features/review/ReviewFlashcardSession";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

import type { Metadata } from "next";
import { getReviewSessionMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const title = await getReviewSessionMetadataTitle(sessionId, "Flashcard");
  return { title };
}

export default async function ReviewSessionFlashcardPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await requireReviewSession(sessionId);
  if (!session) notFound();

  return (
    <PageContainer className="py-6 sm:py-8">
      <ReviewFlashcardSession
        words={session.words}
        setInfo={{ id: session.id, title: session.title }}
        onBackHref={`/review/session/${sessionId}`}
        reviewSessionId={sessionId}
      />
    </PageContainer>
  );
}
