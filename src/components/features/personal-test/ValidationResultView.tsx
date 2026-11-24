"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Lightbulb, BookOpen, Layers, HelpCircle, FileText } from "lucide-react";
import { ValidationResult } from "@/types/vocabee-test";
import { Badge } from "@/components/ui/badge";

interface ValidationResultViewProps {
  result: ValidationResult | null;
}

export function ValidationResultView({ result }: ValidationResultViewProps) {
  if (!result) return null;

  if (result.valid) {
    const { summary } = result;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all">
        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>JSON hợp lệ theo chuẩn vocabee-test-v1!</span>
          <Badge variant="outline" className="ml-auto border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
            Sẵn sàng lưu
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-2">
            <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground">Tiêu đề</div>
              <div className="font-semibold text-foreground truncate">{summary.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-2">
            <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Từ vựng</div>
              <div className="font-semibold text-foreground">{summary.totalWords} từ</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-2">
            <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Số lượng Set</div>
              <div className="font-semibold text-foreground">{summary.totalSets} Sets</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-2">
            <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Tổng câu hỏi</div>
              <div className="font-semibold text-foreground">{summary.totalQuestions} câu ({summary.totalExercises} bài tập)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 transition-all">
      <div className="flex items-center gap-2.5 text-destructive font-semibold text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>Phát hiện {result.errors.length} lỗi trong cấu trúc JSON</span>
      </div>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {result.errors.map((err, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-destructive/20 bg-background/80 p-3 text-xs space-y-1.5"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-destructive">
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                {err.path}
              </span>
            </div>

            <p className="text-foreground font-medium leading-relaxed">{err.message}</p>

            {(err.expected || err.found) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-md bg-muted/40 p-2 text-[11px] font-mono">
                {err.expected && (
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Quy chuẩn: </span>
                    <span className="text-foreground">{err.expected}</span>
                  </div>
                )}
                {err.found && (
                  <div>
                    <span className="text-destructive font-semibold">Thực tế: </span>
                    <span className="text-foreground">{err.found}</span>
                  </div>
                )}
              </div>
            )}

            {err.suggestion && (
              <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] pt-1">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Gợi ý: {err.suggestion}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
