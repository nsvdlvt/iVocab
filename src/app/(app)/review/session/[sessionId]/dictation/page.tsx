import React from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { DictationViewer } from "@/components/features/dictation/DictationViewer";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionDictationPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = requireReviewSession(sessionId);
  if (!session) notFound();

  return (
    <PageContainer className="pt-2 md:pt-4">
      <DictationViewer
        initialWords={session.words}
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
