"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  CheckSquare,
  Square,
  Folder,
  BookOpen,
  ArrowRight,
  Plus,
  Layers,
  Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { SelectableVocabSet } from "@/lib/personal-test/vocabulary-selection";

interface SetSelectionStepProps {
  sets: SelectableVocabSet[];
  selectedSetIds: Set<string>;
  onToggleSet: (setId: string) => void;
  onSelectVisibleSets: (visibleIds: string[]) => void;
  onDeselectAllSets: () => void;
  onContinue: () => void;
  isLoadingWords: boolean;
}

export function SetSelectionStep({
  sets,
  selectedSetIds,
  onToggleSet,
  onSelectVisibleSets,
  onDeselectAllSets,
  onContinue,
  isLoadingWords,
}: SetSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const visibleSets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  }, [sets, searchQuery]);

  const totalAvailableWordsInSelected = useMemo(() => {
    let sum = 0;
    for (const s of sets) {
      if (selectedSetIds.has(s.id)) {
        sum += s.wordCount;
      }
    }
    return sum;
  }, [sets, selectedSetIds]);

  const allVisibleSelected =
    visibleSets.length > 0 && visibleSets.every((s) => selectedSetIds.has(s.id));

  if (sets.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-2 border-border/80 bg-muted/15 p-8 text-center">
        <CardContent className="flex flex-col items-center justify-center p-0 space-y-4 max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Folder className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Bạn chưa có bộ từ vựng nào
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Hãy tạo bộ từ vựng đầu tiên hoặc lưu từ mới vào kho từ vựng để bắt đầu tạo bài kiểm tra cá nhân với AI.
            </p>
          </div>
          <Link
            href="/u/vocabulary/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-2 rounded-xl font-semibold"
            )}
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bộ từ vựng mới</span>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar: Search + Bulk Set Actions + Summary */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bộ từ vựng theo tên..."
              aria-label="Tìm kiếm bộ từ vựng"
              className="h-9 rounded-xl pl-9 pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectVisibleSets(visibleSets.map((s) => s.id))}
              disabled={visibleSets.length === 0 || allVisibleSelected}
              className="h-8 gap-1.5 rounded-lg text-xs cursor-pointer"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Chọn tất cả hiển thị</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDeselectAllSets}
              disabled={selectedSetIds.size === 0}
              className="h-8 gap-1.5 rounded-lg text-xs cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Bỏ chọn tất cả</span>
            </Button>
          </div>
        </div>

        {/* Selection Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" />
              <span>Đã chọn {selectedSetIds.size} bộ từ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 font-medium text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>
                Tổng số từ khả dụng:{" "}
                <strong className="font-bold tabular-nums">
                  {totalAvailableWordsInSelected}
                </strong>{" "}
                từ
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={onContinue}
            disabled={
              selectedSetIds.size === 0 ||
              totalAvailableWordsInSelected === 0 ||
              isLoadingWords
            }
            size="sm"
            className="h-9 gap-1.5 rounded-xl px-4 font-semibold cursor-pointer shadow-xs"
          >
            <span>
              {isLoadingWords ? "Đang tải từ vựng..." : "Tiếp tục chọn từ vựng"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sets Grid */}
      {visibleSets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Không tìm thấy bộ từ vựng nào khớp với &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">
            Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleSets.map((set) => {
            const isSelected = selectedSetIds.has(set.id);
            const levelEntries = Object.entries(set.levelDistribution);
            const updatedLabel = formatDistanceToNow(new Date(set.updated_at), {
              addSuffix: true,
              locale: vi,
            });

            return (
              <div
                key={set.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onToggleSet(set.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleSet(set.id);
                  }
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/30"
                    : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/20"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: set.color || "hsl(var(--primary))",
                        }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {set.title}
                        </h3>
                        {set.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {set.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-0.5 shrink-0"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSet(set.id)}
                        aria-label={`Chọn bộ từ ${set.title}`}
                      />
                    </div>
                  </div>

                  {/* Level / CEFR Distribution Badges if available */}
                  {levelEntries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {levelEntries.map(([level, count]) => (
                        <Badge
                          key={level}
                          variant="secondary"
                          className="text-[10px] font-semibold px-1.5 py-0"
                        >
                          {level}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="tabular-nums">{set.wordCount} từ</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] truncate">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">{updatedLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
