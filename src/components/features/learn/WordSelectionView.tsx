"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Play,
  ArrowLeft,
  Check,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type VocabularyWithReview,
  getWordMasteryInfo,
  getDefaultSelectedWordIds,
  prioritizeWordsForLearning,
} from "@/lib/learning/mastery-selection";
import { useSpeak } from "@/hooks/use-speak";

interface WordSelectionViewProps {
  words: VocabularyWithReview[];
  setInfo: { id: string; title: string };
  onStartLearning: (selectedIds: string[]) => void;
  isLoading?: boolean;
  onBackHref?: string;
}

export function WordSelectionView({
  words,
  setInfo,
  onStartLearning,
  isLoading = false,
  onBackHref,
}: WordSelectionViewProps) {
  const { speakText } = useSpeak();

  // Sort words by mastery priority deterministically
  const prioritizedWords = useMemo(() => {
    return prioritizeWordsForLearning(words);
  }, [words]);

  // Compute stable initial default 10 words based on mastery
  const defaultSelectedIds = useMemo(() => {
    return getDefaultSelectedWordIds(words, 10);
  }, [words]);

  // User-controlled selection state
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(
    () => new Set(defaultSelectedIds)
  );

  const totalWordsCount = words.length;
  const selectedCount = selectedWordIds.size;
  const isAllSelected = selectedCount === totalWordsCount && totalWordsCount > 0;
  const isNoneSelected = selectedCount === 0;

  // Toggle single word
  const toggleWord = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all words
  const handleSelectAll = () => {
    setSelectedWordIds(new Set(words.map((w) => w.id)));
  };

  // Deselect all words
  const handleDeselectAll = () => {
    setSelectedWordIds(new Set());
  };

  // Reset to default 10 optimal words
  const handleResetToOptimal = () => {
    setSelectedWordIds(new Set(defaultSelectedIds));
  };

  const handleStart = () => {
    if (selectedCount === 0 || isLoading) return;
    onStartLearning(Array.from(selectedWordIds));
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {onBackHref && (
            <Link
              href={onBackHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại bộ từ</span>
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Chọn từ vựng học thích ứng
            </span>
            <Badge variant="outline" className="tabular-nums">
              Tổng số {totalWordsCount} từ
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {setInfo.title}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Hệ thống đã tự động chọn 10 từ ưu tiên nhất dựa trên mức độ thành thạo và lịch sử ôn tập của bạn. Bạn có thể tự do thêm hoặc bớt từ tùy ý.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={isNoneSelected || isLoading}
            className="w-full sm:w-auto font-semibold gap-2 shadow-xs"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Bắt đầu học</span>
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold tabular-nums">
              {selectedCount}
            </span>
          </Button>
          <span className="text-[11px] text-muted-foreground font-medium text-center sm:text-right tabular-nums">
            {isNoneSelected
              ? "Vui lòng chọn ít nhất 1 từ"
              : `Đã chọn ${selectedCount} / ${totalWordsCount} từ`}
          </span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="h-8 gap-1.5 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Chọn tất cả</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={isNoneSelected}
            className="h-8 gap-1.5 text-xs"
          >
            <Square className="h-3.5 w-3.5" />
            <span>Bỏ chọn tất cả</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToOptimal}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Mặc định (10 từ tối ưu)</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-foreground tabular-nums">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Đã chọn {selectedCount} từ</span>
        </div>
      </div>

      {/* Word Cards List */}
      <div className="space-y-2.5">
        {prioritizedWords.map((word, index) => {
          const isSelected = selectedWordIds.has(word.id);
          const masteryInfo = getWordMasteryInfo(word);
          const isTop10Optimal = index < 10;

          return (
            <div
              key={word.id}
              onClick={() => toggleWord(word.id)}
              className={cn(
                "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition-all duration-150 cursor-pointer select-none",
                isSelected
                  ? "border-primary/40 bg-primary/[0.03] shadow-2xs dark:bg-primary/[0.06]"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/20 opacity-80"
              )}
            >
              {/* Left Column: Checkbox, Word, IPA, Meaning */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-background group-hover:border-foreground/60"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-foreground">
                      {word.word}
                    </span>

                    {word.ipa && (
                      <span className="text-xs font-mono text-muted-foreground">
                        /{word.ipa}/
                      </span>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(word.word);
                      }}
                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                      aria-label={`Phát âm ${word.word}`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>

                    {word.part_of_speech && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold uppercase tracking-wider py-0 px-1.5"
                      >
                        {word.part_of_speech}
                      </Badge>
                    )}

                    {word.difficulty && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider py-0 px-1.5 border-border/80"
                      >
                        {word.difficulty}
                      </Badge>
                    )}

                    {isTop10Optimal && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        <Sparkles className="h-2.5 w-2.5" />
                        Ưu tiên học
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-foreground/90">
                    {word.meaning}
                  </p>

                  {word.example && (
                    <p className="line-clamp-1 text-xs italic text-muted-foreground">
                      &ldquo;{word.example}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Mastery Badge */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums",
                    masteryInfo.colorClass
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{masteryInfo.label}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Sticky Bar on Mobile */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-lg backdrop-blur-md sm:hidden">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground tabular-nums">
            Đã chọn {selectedCount} từ
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isNoneSelected ? "Chưa chọn từ nào" : "Sẵn sàng học"}
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleStart}
          disabled={isNoneSelected || isLoading}
          className="font-semibold gap-1.5"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Bắt đầu học</span>
        </Button>
      </div>
    </div>
  );
}
