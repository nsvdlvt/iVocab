import React from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
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
          href="/"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-3 gap-1 rounded-xl cursor-pointer inline-flex items-center",
          })}
        >
          <ChevronLeft className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div>

      <PageHeader
        title={session.title}
        description={session.description}
        action={
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <GraduationCap className="mr-1 inline-block h-3.5 w-3.5" />
            Phiên ôn tạm
          </div>
        }
      />

      <StudyModes setId={sessionId} basePath="/review/session" />

      <SectionCard className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Danh sách từ ôn
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {session.words.map((word) => (
            <div key={word.id} className="rounded-2xl border bg-background/70 p-4 shadow-sm">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{word.word}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{word.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
