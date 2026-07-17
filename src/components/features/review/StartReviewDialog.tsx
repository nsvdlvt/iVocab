"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, CalendarClock, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  triggerLabel = "Bắt đầu ôn tập",
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
        const response = await fetch(`/api/review-sessions?vocabularySetId=${encodeURIComponent(vocabularySetId)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as
          | { success: true; stats: ReviewStats }
          | { success: false; error: string };

        if (!response.ok || !data.success) {
          throw new Error("error" in data ? data.error : "Không thể tải thống kê ôn tập.");
        }

        setStats(data.stats);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải thống kê ôn tập.");
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
        throw new Error("error" in data ? data.error : "Không thể tạo phiên ôn tập.");
      }

      setOpen(false);
      router.push(`/review/session/${data.session.id}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Không thể tạo phiên ôn tập.");
    } finally {
      setSubmitting(false);
    }
  };

  const canStart = (stats?.reviewNowCount ?? 0) > 0;
  const progressValue = stats && stats.totalCount > 0 ? Math.round((stats.learnedCount / stats.totalCount) * 100) : 0;
  const estimatedMinutes = estimateMinutes(stats?.reviewNowCount ?? 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className={cn("rounded-xl gap-2 cursor-pointer shadow-sm inline-flex items-center", className)}
      >
        <GraduationCap className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <DialogContent
        showCloseButton={false}
        className="w-[min(calc(100vw-0.5rem),46rem)] max-w-none overflow-hidden border-white/50 bg-background/85 p-0 text-foreground shadow-[0_30px_100px_rgba(15,23,42,0.24)] backdrop-blur-2xl sm:w-[min(calc(100vw-2rem),48rem)]"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.985 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
          <div className="relative space-y-4 p-4 sm:p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight sm:text-[1.7rem]">📚 Ôn tập bộ từ vựng</DialogTitle>
              <DialogDescription className="max-w-xl text-sm text-muted-foreground">
                Hiển thị tình trạng học tập của bộ từ này trước khi bắt đầu.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-3xl border border-border/60 bg-muted/30 animate-pulse" />
                <div className="h-18 rounded-2xl border border-border/60 bg-muted/30 animate-pulse" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/60 bg-card/80 px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 pt-0.5">
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Phiên ôn tập hôm nay</p>
                          <p className="text-4xl font-black tracking-tight">{stats.reviewNowCount} từ</p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-border/60 pt-3">
                        <CompactStatRow icon={<CalendarClock className="h-3.5 w-3.5" />} label="Cần ôn tập" value={stats.reviewNowCount} tone="rose" />
                        <CompactStatRow icon={<Clock3 className="h-3.5 w-3.5" />} label="Sắp đến hạn" value={stats.dueSoonCount} tone="amber" />
                        <CompactStatRow icon={<BookOpenCheck className="h-3.5 w-3.5" />} label="Chưa học" value={stats.notLearnedCount} tone="emerald" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/70" />

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <MetricPill label="Đã ghi nhớ" value={`${progressValue}%`} />
                  <MetricPill label="Ước tính" value={estimatedMinutes} />
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground">
                {error ?? "Không thể tải thống kê ôn tập."}
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={!canStart || loading || submitting}
              className="h-12 w-full rounded-2xl bg-blue-600 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? "Đang tạo..." : "Bắt đầu ôn tập"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
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
    rose: "text-rose-600 dark:text-rose-300",
    amber: "text-amber-600 dark:text-amber-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
  } as const;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background/70 px-3 py-2">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-current/10", toneClasses[tone])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <div className={cn("text-base font-black tabular-nums", toneClasses[tone])}>{value}</div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function estimateMinutes(reviewCount: number) {
  if (reviewCount <= 0) return "0 phút";
  const minutes = Math.max(1, Math.round(reviewCount * 0.2));
  return `${minutes} phút`;
}
