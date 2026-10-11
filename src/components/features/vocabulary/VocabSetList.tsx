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
  Globe,
  Lock,
  Link2,
  BookOpen,
} from "lucide-react";
import { duplicateVocabularySet } from "@/actions/vocab-sets/duplicate";
import { toast } from "sonner";
import { ShareSetDialog } from "./ShareSetDialog";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabSetListProps {
  sets: VocabSetRow[];
  summaries?: Record<string, VocabSetProgressSummary>;
  onEdit: (set: VocabSetRow) => void;
  onDelete: (set: VocabSetRow, isPermanent: boolean) => void;
  onRestore: (set: VocabSetRow) => void;
}

export function VocabSetList({
  sets,
  summaries,
  onEdit,
  onDelete,
  onRestore,
}: VocabSetListProps) {
  const [isPending, setIsPending] = useState(false);
  const [sharingSet, setSharingSet] = useState<VocabSetRow | null>(null);

  const getVisibilityBadge = (vis: string) => {
    switch (vis) {
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
  };

  const handleDuplicate = async (e: React.MouseEvent, setId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPending(true);
    toast.promise(duplicateVocabularySet(setId), {
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

  const handleShare = async (e: React.MouseEvent, set: VocabSetRow) => {
    e.preventDefault();
    e.stopPropagation();
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.SHARE_VOCABULARY_DETAIL(set.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Đã sao chép liên kết chia sẻ.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
    setSharingSet(set);
  };

  const shareLink = sharingSet
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.SHARE_VOCABULARY_DETAIL(sharingSet.id)}`
    : "";

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        {sets.map((set) => {
          const isDeleted = !!set.deleted_at;
          const summary = summaries?.[set.id] ?? null;
          const totalWords = summary?.totalWords ?? 0;
          const masteredCount = summary?.masteredWords ?? 0;
          const learningCount = summary?.learningWords ?? 0;
          const masteredPercent =
            totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
          const learningPercent =
            totalWords > 0 ? Math.round((learningCount / totalWords) * 100) : 0;

          const { color, LucideIcon } = getMetadataOptions(
            set.color || "blue",
            set.icon || "BookOpen"
          );
          const formattedDate = new Date(set.updated_at).toLocaleDateString(
            "vi-VN",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          );

          const listContent = (
            <div className="flex w-full min-w-0 items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    color.lightBg,
                    color.border
                  )}
                >
                  <LucideIcon className={cn("h-5 w-5", color.text)} />
                </div>

                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {set.title}
                    </h3>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{(set.source_language || "en").toUpperCase()}</span>
                      <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                      <span>{(set.target_language || "vi").toUpperCase()}</span>
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                    {set.description || (
                      <span className="italic opacity-60">
                        Chưa có mô tả cho bộ từ này
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                {/* Word count & Mastery Progress */}
                <div className="hidden sm:flex w-36 flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium tabular-nums">
                    <span className="inline-flex items-center gap-1 text-foreground font-semibold">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      {totalWords} từ
                    </span>
                    <span className="text-muted-foreground">
                      {masteredPercent}%
                    </span>
                  </div>
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${masteredPercent}%` }}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${learningPercent}%` }}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="hidden lg:flex flex-col items-end text-right text-[11px] text-muted-foreground tabular-nums">
                  <span>Cập nhật</span>
                  <span className="mt-0.5 font-semibold text-foreground">
                    {formattedDate}
                  </span>
                </div>

                {/* Visibility badge */}
                <div className="hidden md:flex w-28 justify-end">
                  {isDeleted ? (
                    <Badge variant="destructive">Đã xóa</Badge>
                  ) : (
                    getVisibilityBadge(set.visibility || "private")
                  )}
                </div>

                {/* Actions */}
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
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-xl"
                    >
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
                            onClick={(e) => handleShare(e, set)}
                            className="gap-2 text-xs cursor-pointer"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Chia sẻ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDuplicate(e, set.id)}
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
            </div>
          );

          return (
            <SectionCard
              key={set.id}
              hoverable={!isDeleted}
              className={cn(
                "group flex min-h-[72px] w-full items-center overflow-hidden rounded-xl border-border/80 p-0",
                isDeleted && "bg-muted/20 opacity-85"
              )}
            >
              {isDeleted ? (
                <div className="relative h-full w-full">{listContent}</div>
              ) : (
                <Link
                  href={ROUTES.VOCABULARY_DETAIL(set.id)}
                  className="flex h-full w-full"
                >
                  {listContent}
                </Link>
              )}
            </SectionCard>
          );
        })}
      </div>

      <ShareSetDialog
        open={!!sharingSet}
        onOpenChange={(open) => {
          if (!open) setSharingSet(null);
        }}
        shareLink={shareLink}
        visibility={
          (sharingSet?.visibility as "public" | "private" | "unlisted" | null) ??
          "private"
        }
      />
    </>
  );
}
