import React from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { LearnViewer } from "@/components/features/learn/LearnViewer";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionLearnPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await requireReviewSession(sessionId);
  if (!session) notFound();

  return (
    <PageContainer className="py-6 sm:py-8">
      <LearnViewer
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
