import React from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StudyModes } from "@/components/features/vocabulary/StudyModes";
import { requireReviewSession } from "@/lib/review-session/review-session-access";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = requireReviewSession(sessionId);

  return (
    <PageContainer className="space-y-6">
      <div>
        <Link
          href="/review"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-3 gap-1 rounded-xl cursor-pointer inline-flex items-center",
          })}
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại review
        </Link>
      </div>

      <PageHeader
        title={session.title}
        description={session.description}
        action={
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <GraduationCap className="mr-1 inline-block h-3.5 w-3.5" />
            Phiên tạm
          </div>
        }
      />

      <StudyModes setId={sessionId} basePath="/review/session" />
    </PageContainer>
  );
}
