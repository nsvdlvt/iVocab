import React from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { FlashcardViewer } from "@/components/features/flashcard/FlashcardViewer";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionFlashcardPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = requireReviewSession(sessionId);
  if (!session) notFound();

  return (
    <PageContainer className="py-6 sm:py-8">
      <FlashcardViewer
        initialWords={session.words}
        setInfo={{ id: session.id, title: session.title }}
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/review/session/${sessionId}`);
        }}
      />
    </PageContainer>
  );
}
