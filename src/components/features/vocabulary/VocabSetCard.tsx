"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getMetadataOptions } from "@/constants/vocab-set";
import { Database } from "@/types/database";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { MoreVertical, Edit2, Copy, Trash2, RotateCcw, ShieldAlert, ArrowRight } from "lucide-react";
import { duplicateVocabularySet } from "@/actions/vocab-sets/duplicate";
import { toast } from "sonner";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabSetCardProps {
  set: VocabSetRow;
  onEdit: (set: VocabSetRow) => void;
  onDelete: (set: VocabSetRow, isPermanent: boolean) => void;
  onRestore: (set: VocabSetRow) => void;
}

export function VocabSetCard({ set, onEdit, onDelete, onRestore }: VocabSetCardProps) {
  const [isPending, setIsPending] = useState(false);
  const isDeleted = !!set.deleted_at;

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
      }
    });
  };

  const getVisibilityBadge = (vis: string) => {
    switch (vis) {
      case "public":
        return <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-[10px] font-bold">Công khai</Badge>;
      case "unlisted":
        return <Badge variant="outline" className="text-amber-500 bg-amber-500/10 border-amber-500/20 text-[10px] font-bold">Không công khai</Badge>;
      default:
        return <Badge variant="outline" className="text-blue-500 bg-blue-500/10 border-blue-500/20 text-[10px] font-bold">Riêng tư</Badge>;
    }
  };

  // Load last studied session timestamp from localStorage
  const [lastStudiedDate, setLastStudiedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check key patterns matches getStorageKey(set.id) -> ivocab_learn_v1_${set.id}
    const storageKey = `ivocab_learn_v1_${set.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data && data.timestamp) {
          const formatted = new Date(data.timestamp).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          });
          const handle = setTimeout(() => {
            setLastStudiedDate(formatted);
          }, 0);
          return () => clearTimeout(handle);
        }
      } catch {
        // Fallback silently
      }
    }
  }, [set.id]);

  const formattedUpdateDate = new Date(set.updated_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const displayDate = lastStudiedDate || formattedUpdateDate;
  const dateLabel = lastStudiedDate ? "Học lần cuối" : "Cập nhật";

  const cardContent = (
    <div className="p-5 flex flex-col justify-between h-[185px] w-full">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", color.lightBg, color.border)}>
              <LucideIcon className={cn("h-5 w-5", color.text)} />
            </div>
            
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                {set.title}
              </h3>
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                <span>{(set.source_language || "en").toUpperCase()}</span>
                <ArrowRight className="h-3 w-3 inline text-muted-foreground/60" />
                <span>{(set.target_language || "vi").toUpperCase()}</span>
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
                    <DropdownMenuItem onClick={() => onDelete(set, false)} className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 text-xs cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa bộ học
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

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {set.description || <span className="italic opacity-60">Không có mô tả</span>}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground">
        <span className="font-medium">{dateLabel}: {displayDate}</span>
        {isDeleted ? (
          <Badge variant="destructive" className="rounded-lg text-[9px] font-bold px-1.5 py-0.5">Đã xóa</Badge>
        ) : (
          getVisibilityBadge(set.visibility || "private")
        )}
      </div>
    </div>
  );

  return (
    <SectionCard hoverable className="p-0 overflow-hidden flex flex-col justify-between h-[185px] group border-border/80">
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
  );
}
