import React from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { SentenceViewer } from "@/components/features/sentence/SentenceViewer";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReviewSessionSentencePage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await requireReviewSession(sessionId);
  if (!session) notFound();

  const formattedWords = session.words.map((word) => ({
    id: word.id,
    word: word.word,
    meaning: word.meaning,
    partOfSpeech: word.part_of_speech || undefined,
    ipa: word.ipa || undefined,
    isStarred: word.is_starred || false,
    latestScore: 0,
    highestScore: 0,
    attemptCount: 0,
  }));

  return (
    <PageContainer className="pt-2 md:pt-4">
      <SentenceViewer
        initialWords={formattedWords}
        setInfo={{ id: session.id, title: session.title }}
        reviewSessionId={session.id}
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/review/session/${sessionId}`);
        }}
      />
    </PageContainer>
  );
}
