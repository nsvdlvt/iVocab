"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StudyModes } from "@/components/features/vocabulary/StudyModes";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";

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
        const response = await fetch(
          `/api/review-sessions/${encodeURIComponent(sessionId)}`,
          {
            signal: controller.signal,
          }
        );
        const data = (await response.json()) as ReviewSessionResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            "error" in data ? data.error : "Không thể tải dữ liệu phiên ôn tập."
          );
        }

        setSession(data.session);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải dữ liệu phiên ôn tập."
        );
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
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (error || !session) {
    return (
      <PageContainer className="space-y-6">
        <div>
          <Link
            href="/review"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại trung tâm ôn tập</span>
          </Link>
        </div>
        <SectionCard className="py-10 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">
            {error ?? "Không tìm thấy phiên ôn tập."}
          </p>
          <Link
            href="/review"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Về trang ôn tập
          </Link>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <div>
        <Link
          href="/review"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Quay lại trung tâm ôn tập</span>
        </Link>
      </div>

      <PageHeader
        title={session.title}
        description={session.description}
        action={
          <Badge variant="default" className="gap-1.5 px-3 py-1 h-7">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Phiên ôn tập ({session.words.length} từ)</span>
          </Badge>
        }
      />

      <StudyModes setId={sessionId} basePath="/review/session" />

      <SectionCard className="space-y-4">
        <SectionHeader
          title="Danh sách từ vựng trong phiên"
          description={`Gồm ${session.words.length} từ đến hạn cần củng cố`}
          action={
            <Badge variant="secondary" className="tabular-nums">
              {session.words.length} từ
            </Badge>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {session.words.map((word, idx) => (
            <div
              key={word.id}
              className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/15 p-3.5 transition-colors hover:border-border"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {word.word}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {word.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
