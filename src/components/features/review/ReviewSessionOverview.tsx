"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StudyModes } from "@/components/features/vocabulary/StudyModes";

type ReviewSession = {
  id: string;
  vocabularySetId: string | null;
  title: string;
  description: string;
  words: Array<{
    id: string;
    word: string;
    meaning: string;
  }>;
};

type ReviewSessionResponse =
  | { success: true; session: ReviewSession }
  | { success: false; error: string };

interface ReviewSessionOverviewProps {
  sessionId: string;
}

export function ReviewSessionOverview({ sessionId }: ReviewSessionOverviewProps) {
  const [session, setSession] = React.useState<ReviewSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/review-sessions/${encodeURIComponent(sessionId)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ReviewSessionResponse;

        if (!response.ok || !data.success) {
          throw new Error("error" in data ? data.error : "Không thể tải dữ liệu phiên ôn tập.");
        }

        setSession(data.session);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu phiên ôn tập.");
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [sessionId]);

  if (loading) {
    return (
      <PageContainer className="space-y-6">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-3xl border bg-card px-8 py-10 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !session) {
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
            Quay lại ôn tập
          </Link>
        </div>
        <SectionCard className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{error ?? "Không tìm thấy phiên ôn tập."}</p>
        </SectionCard>
      </PageContainer>
    );
  }

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
          Quay lại ôn tập
        </Link>
      </div>

      <PageHeader
        title={session.title}
        description={session.description}
        action={
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <GraduationCap className="mr-1 inline-block h-3.5 w-3.5" />
            Phiên ôn tập
          </div>
        }
      />

      <StudyModes setId={sessionId} basePath="/review/session" />

      <SectionCard className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Danh sách từ ôn</h2>
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
