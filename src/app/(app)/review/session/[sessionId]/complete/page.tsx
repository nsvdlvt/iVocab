import React from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireReviewSession } from "@/lib/review-session/review-session-access";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionCompletePage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = ReviewSessionStore.get(sessionId) ?? requireReviewSession(sessionId);
  if (session) {
    ReviewSessionStore.delete(sessionId);
  }

  return (
    <PageContainer className="py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-10 text-center shadow-sm space-y-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">Review Complete</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You reviewed all scheduled words.
          </p>
        </div>
        <Link
          href="/review"
          className={buttonVariants({
            variant: "default",
            className: "rounded-xl px-5",
          })}
        >
          Return to Review
        </Link>
      </div>
    </PageContainer>
  );
}
