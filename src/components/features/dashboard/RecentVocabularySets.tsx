import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Plus, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface RecentVocabularySetsProps {
  sets: VocabSetRow[];
}

export function RecentVocabularySets({ sets }: RecentVocabularySetsProps) {
  return (
    <SectionCard className="flex flex-col h-full justify-between space-y-4">
      <div className="space-y-4">
        <SectionHeader
          title="Bộ từ vựng gần đây"
          description="Tiếp tục rèn luyện các bộ từ bạn đang theo học"
          className="mb-0"
          action={
            <div className="flex items-center gap-1.5">
              <Link
                href="/vocabulary/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tạo mới</span>
              </Link>
              <Link
                href={ROUTES.VOCABULARY}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <span>Tất cả</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
        />

        {sets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 py-12 px-4 text-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-semibold text-foreground">
                Chưa có bộ từ vựng nào
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Tạo bộ từ đầu tiên của bạn hoặc nhập danh sách từ vựng hàng loạt bằng AI để bắt đầu học.
              </p>
            </div>
            <Link
              href="/vocabulary/new"
              className={cn(buttonVariants({ size: "sm" }), "mt-1")}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo bộ từ vựng</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sets.map((set) => (
              <div
                key={set.id}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-muted/15 p-4 transition-all duration-150 hover:border-primary/35 hover:bg-muted/30 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={ROUTES.VOCABULARY_DETAIL(set.id)}
                      className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                    >
                      {set.title}
                    </Link>
                    {set.visibility && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                        {set.visibility === "private"
                          ? "Riêng tư"
                          : set.visibility === "unlisted"
                            ? "Ẩn danh sách"
                            : "Công khai"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed min-h-[2.25rem]">
                    {set.description || "Bộ từ vựng cá nhân"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {set.source_language && set.target_language
                      ? `${set.source_language.toUpperCase()} → ${set.target_language.toUpperCase()}`
                      : "EN → VI"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/vocabulary/${set.id}/flashcard`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "xs" }),
                        "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Layers className="h-3 w-3" />
                      <span>Thẻ từ</span>
                    </Link>
                    <Link
                      href={`/vocabulary/${set.id}/learn`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "xs" }),
                        "text-primary"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Học</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
