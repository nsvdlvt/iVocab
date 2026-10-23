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
  RotateCcw,
  ShieldAlert,
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
import { ShareSetDialog } from "./ShareSetDialog";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabSetCardProps {
  set: VocabSetRow;
  summary?: VocabSetProgressSummary | null;
  onEdit: (set: VocabSetRow) => void;
  onDelete: (set: VocabSetRow, isPermanent: boolean) => void;
  onRestore: (set: VocabSetRow) => void;
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
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;

  const months = Math.floor(days / 30);
  return `${Math.max(1, months)} tháng trước`;
}

function renderVisibilityBadge(visibility: string | null, isDeleted: boolean) {
  if (isDeleted) {
    return (
      <Badge variant="destructive" className="gap-1">
        Đã xóa
      </Badge>
    );
  }
  switch (visibility) {
    case "public":
      return (
        <Badge variant="success" className="gap-1">
          <Globe className="h-3 w-3" />
          Công khai
        </Badge>
      );
    case "unlisted":
      return (
        <Badge variant="warning" className="gap-1">
          <Link2 className="h-3 w-3" />
          Không công khai
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Riêng tư
        </Badge>
      );
  }
}

export function VocabSetCard({
  set,
  summary,
  onEdit,
  onDelete,
  onRestore,
}: VocabSetCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const isDeleted = !!set.deleted_at;
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.SHARE_VOCABULARY_DETAIL(set.id)}`;

  const { color, LucideIcon } = getMetadataOptions(
    set.color || "blue",
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
  const lastStudiedLabel = formatRelativeTime(summary?.lastStudiedAt ?? null);

  const cardContent = (
    <div className="flex h-full min-h-[236px] w-full flex-col justify-between p-5">
      {/* Top section */}
      <div className="space-y-3.5">
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
              <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
                {set.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{(set.source_language || "en").toUpperCase()}</span>
                  <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                  <span>{(set.target_language || "vi").toUpperCase()}</span>
                </span>
                {renderVisibilityBadge(set.visibility, isDeleted)}
              </div>
            </div>
          </div>

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
                {!isDeleted ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit(set)}
                      className="gap-2 text-xs cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Chỉnh sửa
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(set, false)}
                      className="gap-2 text-xs cursor-pointer text-muted-foreground focus:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Chuyển vào thùng rác
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(set, true)}
                      variant="destructive"
                      className="gap-2 text-xs cursor-pointer"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Xóa vĩnh viễn
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => onRestore(set)}
                      className="gap-2 text-xs cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Khôi phục
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(set, true)}
                      variant="destructive"
                      className="gap-2 text-xs cursor-pointer"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Xóa vĩnh viễn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
          {set.description || (
            <span className="italic opacity-60">Chưa có mô tả cho bộ từ này</span>
          )}
        </p>
      </div>

      {/* Bottom SRS Progress & Quick Study */}
      <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-neutral-800/80 pt-3.5">
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

          {!isDeleted && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground">
              <Play className="h-3 w-3 fill-current" />
              <span>Học ngay</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SectionCard
        hoverable={false}
        className={cn(
          "group flex min-h-[236px] flex-col justify-between overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-neutral-800 bg-card p-0 shadow-none transition-all duration-200",
          !isDeleted &&
            "hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer",
          isDeleted && "bg-muted/20 opacity-85"
        )}
      >
        {isDeleted ? (
          <div className="relative h-full w-full">{cardContent}</div>
        ) : (
          <Link
            href={ROUTES.VOCABULARY_DETAIL(set.id)}
            className="flex h-full w-full focus-visible:outline-none"
          >
            {cardContent}
          </Link>
        )}
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
