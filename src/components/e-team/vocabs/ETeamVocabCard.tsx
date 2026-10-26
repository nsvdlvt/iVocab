"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMetadataOptions } from "@/constants/vocab-set";
import { Database } from "@/types/database";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import {
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  ArrowRight,
  Share2,
  Lock,
  Globe,
  Link2,
  Play,
  Clock,
  BookOpen,
} from "lucide-react";
import { duplicateVocabularySet } from "@/actions/vocab-sets/duplicate";
import { toast } from "sonner";
import { ShareSetDialog } from "@/components/features/vocabulary/ShareSetDialog";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface ETeamVocabCardProps {
  set: VocabSetRow;
  summary?: VocabSetProgressSummary | null;
  onDelete?: (set: VocabSetRow) => void;
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return "Chưa học";

  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Chưa học";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;

  return new Date(iso).toLocaleDateString("vi-VN", {
    month: "2-digit",
    day: "2-digit",
  });
}

export function ETeamVocabCard({
  set,
  summary,
  onDelete,
}: ETeamVocabCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${set.id}`
      : `/share/${set.id}`;

  const { color, LucideIcon } = getMetadataOptions(
    set.color || "purple",
    set.icon || "BookOpen"
  );

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPending(true);
    toast.promise(duplicateVocabularySet(set.id), {
      loading: "Đang nhân bản bộ từ vựng...",
      success: (res) => {
        setIsPending(false);
        if (res.success) return "Nhân bản bộ từ vựng thành công!";
        throw new Error(res.error || "Lỗi nhân bản.");
      },
      error: (err) => {
        setIsPending(false);
        return err.message || "Lỗi nhân bản.";
      },
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Đã sao chép liên kết chia sẻ.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }

    setShareDialogOpen(true);
  };

  const masteredCount = summary?.masteredWords ?? 0;
  const learningCount = summary?.learningWords ?? 0;
  const newCount = summary?.newWords ?? 0;
  const totalWords = summary?.totalWords ?? 0;
  const masteredPercent =
    totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const learningPercent =
    totalWords > 0 ? Math.round((learningCount / totalWords) * 100) : 0;

  const lastStudiedLabel = formatRelativeTime(
    summary?.lastStudiedAt ?? null
  );

  const detailUrl = ROUTES.ETEAM_VOCAB_DETAIL(set.id);
  const learnUrl = ROUTES.ETEAM_VOCAB_LEARN(set.id);

  return (
    <>
      <SectionCard
        hoverable={false}
        className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-200 hover:border-purple-500/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="space-y-3.5">
          {/* Top Row: Icon, Languages, Visibility, Dropdown */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
                  color.lightBg,
                  color.border
                )}
              >
                <LucideIcon className={cn("h-5 w-5", color.text)} />
              </div>

              <div className="min-w-0 space-y-1">
                <Link
                  href={detailUrl}
                  className="font-semibold text-foreground text-base tracking-tight hover:text-purple-600 dark:hover:text-purple-400 line-clamp-1 block transition-colors"
                >
                  {set.title}
                </Link>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider bg-muted text-muted-foreground text-[10px]">
                    <span>{(set.source_language || "en").toUpperCase()}</span>
                    <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                    <span>{(set.target_language || "vi").toUpperCase()}</span>
                  </span>

                  {set.visibility === "public" ? (
                    <Badge variant="success" className="h-5 gap-1 text-[10px] px-1.5">
                      <Globe className="h-3 w-3" />
                      Công khai
                    </Badge>
                  ) : set.visibility === "unlisted" ? (
                    <Badge variant="warning" className="h-5 gap-1 text-[10px] px-1.5">
                      <Link2 className="h-3 w-3" />
                      Không công khai
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-5 gap-1 text-[10px] px-1.5">
                      <Lock className="h-3 w-3" />
                      Riêng tư
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Options Dropdown */}
            <div
              className="shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={isPending}
                      aria-label="Tùy chọn bộ từ"
                    />
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => {
                      window.location.href = `/u/vocabulary/${set.id}/edit`;
                    }}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Chỉnh sửa từ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShare}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Chia sẻ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Nhân bản
                  </DropdownMenuItem>
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(set)}
                        className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa bộ từ
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
            {set.description || (
              <span className="italic opacity-60">Chưa có mô tả cho bộ từ này</span>
            )}
          </p>
        </div>

        {/* Bottom SRS Progress & Quick Study */}
        <div className="mt-4 space-y-3 border-t border-border/70 pt-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-foreground font-semibold tabular-nums">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {totalWords} từ vựng
              </span>
              <span className="text-muted-foreground tabular-nums">
                Đã thuộc{" "}
                <strong className="font-semibold text-foreground">
                  {masteredCount}/{totalWords}
                </strong>{" "}
                ({masteredPercent}%)
              </span>
            </div>

            {/* Segmented Mastery Bar */}
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${masteredPercent}%` }}
                title={`Đã thuộc: ${masteredCount} từ`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${learningPercent}%` }}
                title={`Đang học: ${learningCount} từ`}
              />
            </div>

            <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2.5 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {masteredCount} thuộc
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {learningCount} đang học
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  {newCount} mới
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">{lastStudiedLabel}</span>
            </span>

            <Link
              href={learnUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/10 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-600 hover:text-white"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Học ngay</span>
            </Link>
          </div>
        </div>
      </SectionCard>

      <ShareSetDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareLink={shareLink}
        visibility={
          (set.visibility as "public" | "private" | "unlisted" | null) ??
          "private"
        }
      />
    </>
  );
}
