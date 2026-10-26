import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  Edit2,
  ArrowRight,
  Globe,
  Lock,
  Link2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WordTable } from "@/components/features/vocabulary/WordTable";
import { StudyModes } from "@/components/features/vocabulary/StudyModes";
import { ShareSetTriggerButton } from "@/components/features/vocabulary/ShareSetDialog";
import { StartReviewDialog } from "@/components/features/review/StartReviewDialog";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { SrsService } from "@/lib/srs/srs-service";
import { getMetadataOptions } from "@/constants/vocab-set";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/get-current-user";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  try {
    const user = await getCurrentUser();
    if (user) {
      const set = await VocabSetRepository.getVocabSetById(setId, user.id);
      if (set?.title) {
        return {
          title: set.title,
          description: set.description || `Bộ từ vựng ${set.title} trên Vocabee`,
        };
      }
    }
    const publicSet = await VocabSetRepository.getPublicVocabSetById(setId);
    if (publicSet?.title) {
      return {
        title: publicSet.title,
        description: publicSet.description || `Bộ từ vựng ${publicSet.title} trên Vocabee`,
      };
    }
  } catch {}
  return {
    title: "Bộ từ vựng",
  };
}

export default async function VocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [set, words, wordsWithReview] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    VocabularyRepository.getBySetId(setId, user.id),
    ReviewRepository.getBySetId(user.id, setId),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  const { color, LucideIcon } = getMetadataOptions(
    set.color || "blue",
    set.icon || "BookOpen"
  );

  // Compute SRS distribution across words in this set
  let newCount = 0;
  let learningCount = 0;
  let dueCount = 0;
  let masteredCount = 0;

  for (const w of wordsWithReview) {
    const level = SrsService.getLevelFromReview(w.review ?? null);
    const isDue = Boolean(
      w.review?.next_review &&
        SrsService.canReviewWord({ level, nextReviewAt: w.review.next_review })
    );

    if (level >= 5) {
      masteredCount += 1;
    } else if (isDue) {
      dueCount += 1;
    } else if (level >= 1) {
      learningCount += 1;
    } else {
      newCount += 1;
    }
  }

  const totalWords = wordsWithReview.length;
  const masteredPct =
    totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const learningPct =
    totalWords > 0 ? Math.round((learningCount / totalWords) * 100) : 0;
  const duePct =
    totalWords > 0 ? Math.round((dueCount / totalWords) * 100) : 0;

  return (
    <PageContainer className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href={ROUTES.VOCABULARY}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Quay lại danh sách bộ từ</span>
        </Link>
      </div>

      {/* Set Header & SRS Mastery Overview */}
      <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                color.lightBg,
                color.border
              )}
            >
              <LucideIcon className={cn("h-6 w-6", color.text)} />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{(set.source_language || "en").toUpperCase()}</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                  <span>{(set.target_language || "vi").toUpperCase()}</span>
                </span>

                {set.visibility === "public" ? (
                  <Badge variant="success" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Công khai
                  </Badge>
                ) : set.visibility === "unlisted" ? (
                  <Badge variant="warning" className="gap-1">
                    <Link2 className="h-3 w-3" />
                    Không công khai
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Riêng tư
                  </Badge>
                )}

                <Badge variant="outline" className="tabular-nums">
                  {totalWords} từ vựng
                </Badge>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {set.title}
              </h1>

              {set.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {set.description}
                </p>
              )}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href={`/u/vocabulary/${setId}/learn`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 gap-1.5 rounded-lg px-4 text-xs sm:text-sm font-semibold justify-center bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span>Học từ vựng</span>
            </Link>

            <StartReviewDialog
              vocabularySetId={setId}
              triggerLabel="Ôn tập ngay"
              className="h-9 w-full sm:w-auto rounded-lg px-4 text-xs sm:text-sm font-semibold justify-center"
            />

            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:w-auto">
              <ShareSetTriggerButton
                setId={setId}
                visibility={
                  (set.visibility as "public" | "private" | "unlisted" | null) ??
                  "private"
                }
              />

              <Link
                href={`/u/vocabulary/${setId}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-medium justify-center"
                )}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa</span>
              </Link>
            </div>
          </div>
        </div>

        {/* SRS Mastery Distribution Bar & Metrics */}
        <div className="border-t border-border/70 pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Tiến độ ghi nhớ SRS
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {masteredPct}% thành thạo ({masteredCount}/{totalWords} từ)
            </span>
          </div>

          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${masteredPct}%` }}
              title={`Thành thạo: ${masteredCount} từ`}
            />
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${learningPct}%` }}
              title={`Đang học: ${learningCount} từ`}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${duePct}%` }}
              title={`Cần ôn ngay: ${dueCount} từ`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <SrsMetricPill
              label="Từ mới"
              count={newCount}
              dotClass="bg-muted-foreground/40"
            />
            <SrsMetricPill
              label="Đang học"
              count={learningCount}
              dotClass="bg-sky-500"
            />
            <SrsMetricPill
              label="Cần ôn ngay"
              count={dueCount}
              dotClass="bg-amber-500"
              highlight={dueCount > 0}
            />
            <SrsMetricPill
              label="Thành thạo"
              count={masteredCount}
              dotClass="bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Study Modes Grid */}
      <StudyModes setId={setId} />

      {/* Vocabulary List Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Danh sách từ vựng ({words.length} từ)
          </h2>
        </div>

        {words.length > 0 ? (
          <WordTable words={wordsWithReview} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/50 px-4 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Bộ từ vựng chưa có từ nào
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy thêm từ vựng đầu tiên bằng trình chỉnh sửa hoặc nhập nhanh bằng AI.
              </p>
            </div>
            <Link
              href={`/u/vocabulary/${setId}/edit`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-1 gap-1.5 rounded-lg"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Thêm từ vựng</span>
            </Link>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function SrsMetricPill({
  label,
  count,
  dotClass,
  highlight = false,
}: {
  label: string;
  count: number;
  dotClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2",
        highlight
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border/70 bg-muted/25"
      )}
    >
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full shrink-0", dotClass)} />
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          highlight
            ? "text-amber-600 dark:text-amber-400"
            : "text-foreground"
        )}
      >
        {count}
      </span>
    </div>
  );
}
