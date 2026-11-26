"use client";

import React, { useMemo } from "react";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  BookOpen,
  ListOrdered,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import {
  type DeduplicatedTargetWord,
  type SelectableVocabSet,
  type SelectableVocabularyWord,
  formatDifficultyLabel,
  getPlannedSetSizes,
  MAX_WORDS_FOR_PERSONAL_TEST,
  MIN_WORDS_FOR_PERSONAL_TEST,
} from "@/lib/personal-test/vocabulary-selection";

interface TestConfigStepProps {
  title: string;
  onTitleChange: (nextTitle: string) => void;
  selectedRecords: SelectableVocabularyWord[];
  deduplicatedTargets: DeduplicatedTargetWord[];
  selectedSets: SelectableVocabSet[];
  onBack: () => void;
  onGenerate: () => void;
  onCancelGenerate: () => void;
  isGenerating: boolean;
  generationError: string | null;
}

const FIXED_EXERCISE_TYPES = [
  {
    order: 1,
    key: "matching",
    name: "Matching (Nối từ & định nghĩa)",
    description: "Ghép từ mục tiêu với định nghĩa tiếng Anh ngắn gọn và chính xác.",
  },
  {
    order: 2,
    key: "sentence_completion",
    name: "Sentence Completion (Hoàn thành câu)",
    description: "Sử dụng ngân hàng từ vựng (Word Bank) để điền vào câu ngữ cảnh.",
  },
  {
    order: 3,
    key: "synonyms_matching",
    name: "Synonyms Matching (Nối từ đồng nghĩa)",
    description: "Ghép từ vựng với 1–2 từ đồng nghĩa chính xác kèm giải thích sắc thái.",
  },
  {
    order: 4,
    key: "cloze_test",
    name: "Cloze Test (Điền đoạn văn)",
    description: "Đọc đoạn văn tiếng Anh liền mạch và điền vào các ô trống đánh số.",
  },
] as const;

export function TestConfigStep({
  title,
  onTitleChange,
  selectedRecords,
  deduplicatedTargets,
  selectedSets,
  onBack,
  onGenerate,
  onCancelGenerate,
  isGenerating,
  generationError,
}: TestConfigStepProps) {
  const uniqueCount = deduplicatedTargets.length;
  const plannedSetSizes = useMemo(
    () => getPlannedSetSizes(uniqueCount),
    [uniqueCount]
  );

  const activeSourceSets = useMemo(() => {
    const usedIds = new Set(selectedRecords.map((r) => r.set_id));
    return selectedSets.filter((s) => usedIds.has(s.id));
  }, [selectedRecords, selectedSets]);

  const levelDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of deduplicatedTargets) {
      const label = formatDifficultyLabel(w.difficulty);
      if (label) {
        counts[label] = (counts[label] ?? 0) + 1;
      }
    }
    return Object.entries(counts);
  }, [deduplicatedTargets]);

  const isTooFew = uniqueCount < MIN_WORDS_FOR_PERSONAL_TEST;
  const isTooMany = uniqueCount > MAX_WORDS_FOR_PERSONAL_TEST;
  const isTitleEmpty = title.trim().length === 0;
  const canGenerate = !isTooFew && !isTooMany && !isTitleEmpty && !isGenerating;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isGenerating}
          className="h-9 gap-1.5 rounded-xl text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chỉnh sửa từ</span>
        </Button>

        <div className="text-xs text-muted-foreground">
          Bước cuối: Kiểm tra cấu hình và tạo đề với Vocabee AI
        </div>
      </div>

      {/* Main Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Test Title & Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Test Title Card */}
          <Card className="rounded-2xl border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor="personal-test-title"
                  className="text-sm font-bold text-foreground"
                >
                  Tiêu đề bài kiểm tra
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hệ thống tự gợi ý tên dựa trên bộ từ bạn đã chọn. Bạn có thể chỉnh sửa tự do.
                </p>
              </div>
              <Input
                id="personal-test-title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                disabled={isGenerating}
                maxLength={140}
                placeholder="Nhập tiêu đề bài kiểm tra..."
                className="h-10 rounded-xl text-sm font-medium"
              />
            </CardContent>
          </Card>

          {/* Selected Vocabulary Summary Card */}
          <Card className="rounded-2xl border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Tóm tắt từ vựng đã chọn</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                  <span className="text-muted-foreground block">Bộ từ nguồn</span>
                  <strong className="text-base font-bold text-foreground tabular-nums">
                    {activeSourceSets.length}
                  </strong>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                  <span className="text-muted-foreground block">Bản ghi đã chọn</span>
                  <strong className="text-base font-bold text-foreground tabular-nums">
                    {selectedRecords.length}
                  </strong>
                </div>

                <div className="rounded-xl border border-border/60 bg-primary/5 p-3 space-y-1">
                  <span className="text-primary font-medium block">Từ mục tiêu</span>
                  <strong className="text-base font-bold text-primary tabular-nums">
                    {uniqueCount}
                  </strong>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                  <span className="text-muted-foreground block">Số Set bài thi</span>
                  <strong className="text-base font-bold text-foreground tabular-nums">
                    {plannedSetSizes.length}
                  </strong>
                </div>
              </div>

              {/* Source Set Badges */}
              {activeSourceSets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Bộ từ tham gia:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSourceSets.map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="text-xs font-medium gap-1.5"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: s.color || "hsl(var(--primary))",
                          }}
                        />
                        <span>{s.title}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CEFR / Difficulty Distribution if available */}
              {levelDistribution.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Phân bổ cấp độ hiện có:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {levelDistribution.map(([label, count]) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}: {count} từ
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Planned Internal Set Distribution */}
              {plannedSetSizes.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Phân bổ Set tự động trong bài thi:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                    {plannedSetSizes.map((size, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-background border border-border/70 px-2.5 py-1 font-medium text-foreground"
                      >
                        Set {idx + 1}: {size} từ
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Words Preview Chips */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground">
                  Danh sách từ mục tiêu ({uniqueCount}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {deduplicatedTargets.map((t) => (
                    <Badge
                      key={t.normalizedWord}
                      variant="outline"
                      className="text-xs font-medium bg-background"
                    >
                      {t.word}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Fixed 4-Exercise Structure + Generate Action (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="rounded-2xl border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ListOrdered className="h-4 w-4 text-primary" />
                <span>Cấu trúc 4 dạng bài tập tự động</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mỗi Set trong bài kiểm tra sẽ được AI biên soạn đầy đủ 4 dạng bài tập theo đúng thứ tự chuẩn, kèm giải thích chi tiết bằng tiếng Việt.
              </p>

              <div className="space-y-2.5">
                {FIXED_EXERCISE_TYPES.map((ex) => (
                  <div
                    key={ex.key}
                    className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold font-mono">
                      {ex.order}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold text-foreground">
                        {ex.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {ex.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Validation / Availability Notices */}
          {isTooFew && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Chưa đủ từ vựng để tạo bài kiểm tra</p>
                <p>
                  Cần chọn ít nhất {MIN_WORDS_FOR_PERSONAL_TEST} từ vựng duy nhất để AI tạo bài tập Matching, Sentence Completion, Synonyms Matching và Cloze Test có ý nghĩa.
                </p>
              </div>
            </div>
          )}

          {isTooMany && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Vượt quá giới hạn từ vựng</p>
                <p>
                  Mỗi bài kiểm tra hỗ trợ tối đa {MAX_WORDS_FOR_PERSONAL_TEST} từ duy nhất (hiện đã chọn {uniqueCount} từ). Vui lòng quay lại bỏ bớt {uniqueCount - MAX_WORDS_FOR_PERSONAL_TEST} từ.
                </p>
              </div>
            </div>
          )}

          {generationError && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Không thể tạo bài kiểm tra</p>
                <p className="leading-relaxed">{generationError}</p>
              </div>
            </div>
          )}

          {/* Generation Progress Indicator */}
          {isGenerating ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center space-y-4">
              <div className="flex justify-center">
                <BeeMascot state="thinking" size="md" showAura />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Vocabee AI đang biên soạn bài kiểm tra...</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Đang tạo câu hỏi từ {uniqueCount} từ vựng đã chọn ({plannedSetSizes.length} Set) và kiểm duyệt chặt chẽ ngữ nghĩa, ngữ pháp và độ phủ từ vựng.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelGenerate}
                className="rounded-xl text-xs cursor-pointer"
              >
                Hủy yêu cầu
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full h-12 gap-2 rounded-2xl font-bold text-sm shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tạo bài kiểm tra với AI ({uniqueCount} từ)</span>
            </Button>
          )}

          {!isGenerating && canGenerate && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                Chỉ sử dụng chính xác {uniqueCount} từ bạn đã chọn, không làm thay đổi tiến độ SRS cho tới khi bạn làm bài.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
