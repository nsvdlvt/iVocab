"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getMetadataOptions } from "@/constants/vocab-set";
import { Database } from "@/types/database";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { MoreVertical, Edit2, Copy, Trash2, RotateCcw, ShieldAlert, ArrowRight, Share2, Lock, Globe } from "lucide-react";
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

export function VocabSetCard({ set, summary, onEdit, onDelete, onRestore }: VocabSetCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const isDeleted = !!set.deleted_at;
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.SHARE_VOCABULARY_DETAIL(set.id)}`;

  const { color, LucideIcon } = getMetadataOptions(set.color || "blue", set.icon || "BookOpen");

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
      toast.success("Đã sao chép liên kết.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }

    setShareDialogOpen(true);
  };

  const masteredCount = summary?.masteredWords ?? 0;
  const learningCount = summary?.learningWords ?? 0;
  const newCount = summary?.newWords ?? 0;
  const totalWords = summary?.totalWords ?? 0;
  const masteredPercent = totalWords > 0 ? (masteredCount / totalWords) * 100 : 0;
  const learningPercent = totalWords > 0 ? (learningCount / totalWords) * 100 : 0;
  const newPercent = Math.max(0, 100 - masteredPercent - learningPercent);
  const lastStudiedLabel = formatRelativeTime(summary?.lastStudiedAt ?? null);

  const cardContent = (
    <div className="flex h-full min-h-[228px] w-full flex-col p-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", color.lightBg, color.border)}>
              <LucideIcon className={cn("h-5 w-5", color.text)} />
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                {set.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{(set.source_language || "en").toUpperCase()}</span>
                <ArrowRight className="h-3 w-3 inline text-muted-foreground/60" />
                <span>{(set.target_language || "vi").toUpperCase()}</span>
                <span
                  className={cn(
                    "ml-1 inline-flex items-center justify-center rounded-full p-1",
                    set.visibility === "public"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                  )}
                  title={set.visibility === "public" ? "Công khai" : "Riêng tư"}
                  aria-label={set.visibility === "public" ? "Công khai" : "Riêng tư"}
                >
                  {set.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" disabled={isPending}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-lg">
                {!isDeleted ? (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(set)} className="gap-2 text-xs cursor-pointer">
                      <Edit2 className="h-3.5 w-3.5" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate} className="gap-2 text-xs cursor-pointer">
                      <Copy className="h-3.5 w-3.5" />
                      Nhân bản
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare} className="gap-2 text-xs cursor-pointer">
                      <Share2 className="h-3.5 w-3.5" />
                      Chia sẻ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(set, true)} className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 text-xs cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa vĩnh viễn
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onRestore(set)} className="gap-2 text-xs cursor-pointer">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Khôi phục
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(set, true)} className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-600/10 font-medium text-xs cursor-pointer">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Xóa vĩnh viễn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed min-h-[3.75rem]">
          {set.description || <span className="italic opacity-60">Không có mô tả</span>}
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-3 border-t">
        <div className="space-y-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${masteredPercent}%` }}
              title={`Đã thuộc: ${masteredCount}/${totalWords}`}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${learningPercent}%` }}
              title={`Đang học: ${learningCount}/${totalWords}`}
            />
            <div
              className="h-full bg-slate-200 transition-all duration-700 ease-out dark:bg-slate-700"
              style={{ width: `${newPercent}%` }}
              title={`Chưa học: ${newCount}/${totalWords}`}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
            <span className="min-w-0 whitespace-nowrap">
              Đã thuộc: {masteredCount}/{totalWords}
            </span>
            <span className="min-w-0 truncate text-right">Học lần cuối: {lastStudiedLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SectionCard hoverable className="p-0 overflow-hidden flex flex-col justify-between min-h-[228px] group border-border/80">
        {isDeleted ? (
          <div className="w-full h-full relative bg-muted/20">
            {cardContent}
          </div>
        ) : (
          <Link href={ROUTES.VOCABULARY_DETAIL(set.id)} className="flex w-full h-full">
            {cardContent}
          </Link>
        )}
      </SectionCard>

      <ShareSetDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareLink={shareLink}
        visibility={(set.visibility as "public" | "private" | "unlisted" | null) ?? "private"}
      />
    </>
  );
}
