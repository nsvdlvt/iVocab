"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Clock3,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StartReviewDialogProps {
  vocabularySetId: string;
  triggerLabel?: string;
  className?: string;
}

type ReviewStats = {
  overdueCount: number;
  dueTodayCount: number;
  reviewNowCount: number;
  dueSoonCount: number;
  dueSoonDays: number;
  notLearnedCount: number;
  learnedCount: number;
  totalCount: number;
};

export function StartReviewDialog({
  vocabularySetId,
  triggerLabel = "Ôn tập SRS",
  className,
}: StartReviewDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [stats, setStats] = React.useState<ReviewStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/review-sessions?vocabularySetId=${encodeURIComponent(vocabularySetId)}`,
          {
            signal: controller.signal,
          }
        );
        const data = (await response.json()) as
          | { success: true; stats: ReviewStats }
          | { success: false; error: string };

        if (!response.ok || !data.success) {
          throw new Error(
            "error" in data ? data.error : "Không thể tải thống kê ôn tập."
          );
        }

        setStats(data.stats);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải thống kê ôn tập."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [open, vocabularySetId]);

  const handleStart = async () => {
    if (!stats || stats.reviewNowCount === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularySetId }),
      });
      const data = (await response.json()) as
        | { success: true; session: { id: string } }
        | { success: false; error: string };

      if (!response.ok || !data.success) {
        throw new Error(
          "error" in data ? data.error : "Không thể tạo phiên ôn tập."
        );
      }

      setOpen(false);
      router.push(`/review/session/${data.session.id}`);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Không thể tạo phiên ôn tập."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canStart = (stats?.reviewNowCount ?? 0) > 0;
  const progressValue =
    stats && stats.totalCount > 0
      ? Math.round((stats.learnedCount / stats.totalCount) * 100)
      : 0;
  const estimatedMinutes = estimateMinutes(stats?.reviewNowCount ?? 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className={cn("gap-2", className)}
      >
        <GraduationCap className="h-4 w-4" />
        <span>{triggerLabel}</span>
      </Button>

      <DialogContent className="max-w-lg rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-bold text-foreground">
              Ôn tập bộ từ vựng (SRS)
            </DialogTitle>
            {stats && (
              <Badge variant={canStart ? "warning" : "success"}>
                {canStart ? `${stats.reviewNowCount} từ đến hạn` : "Đã hoàn tất"}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Tổng quan trạng thái ghi nhớ của các từ trong bộ này trước khi bắt đầu.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-24 rounded-xl border border-border/60 bg-muted/30 animate-pulse" />
            <div className="h-14 rounded-xl border border-border/60 bg-muted/30 animate-pulse" />
          </div>
        ) : stats ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border/80 bg-muted/15 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cần ôn tập ngay
                </span>
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {stats.reviewNowCount} từ
                </span>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3">
                <CompactStatRow
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label="Đến hạn & Quá hạn"
                  value={stats.reviewNowCount}
                  tone="rose"
                />
                <CompactStatRow
                  icon={<Clock3 className="h-3.5 w-3.5" />}
                  label="Sắp đến hạn (7 ngày tới)"
                  value={stats.dueSoonCount}
                  tone="amber"
                />
                <CompactStatRow
                  icon={<BookOpenCheck className="h-3.5 w-3.5" />}
                  label="Từ mới / Chưa vào chu kỳ SRS"
                  value={stats.notLearnedCount}
                  tone="emerald"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/15 p-3">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Tỷ lệ ghi nhớ
                </p>
                <p className="text-sm font-bold tabular-nums text-foreground mt-0.5">
                  {progressValue}% ({stats.learnedCount}/{stats.totalCount})
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Thời gian dự kiến
                </p>
                <p className="text-sm font-bold tabular-nums text-foreground mt-0.5">
                  {estimatedMinutes}
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/15 px-4 py-6 text-center text-xs text-muted-foreground">
            {error ?? "Không thể tải thống kê ôn tập."}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button
            onClick={handleStart}
            disabled={!canStart || loading || submitting}
          >
            <span>{submitting ? "Đang tạo phiên..." : "Bắt đầu ôn tập"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompactStatRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "rose" | "amber" | "emerald";
}) {
  const toneClasses = {
    rose: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  } as const;

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-background/80 border border-border/50 px-3 py-2">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border",
          toneClasses[tone]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
      </div>
      <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function estimateMinutes(reviewCount: number) {
  if (reviewCount <= 0) return "0 phút";
  const minutes = Math.max(1, Math.round(reviewCount * 0.2));
  return `~${minutes} phút`;
}
