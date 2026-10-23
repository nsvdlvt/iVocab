"use client";

import React, { memo } from "react";
import { ParsedItem } from "./QuickImportParser";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

interface QuickImportPreviewProps {
  items: ParsedItem[];
  invalidCount: number;
  validCount: number;
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  pronoun: "Đại từ",
};

export const QuickImportPreview = memo(function QuickImportPreview({
  items,
  invalidCount,
  validCount,
}: QuickImportPreviewProps) {
  const getPosLabel = (pos: string) => {
    if (!pos) return "—";
    return PART_OF_SPEECH_LABELS[pos.toLowerCase()] || pos;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      {/* Header Info */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-2.5 select-none">
        <span className="text-xs font-semibold text-foreground">
          Xem trước dữ liệu nhận diện
        </span>
        <Badge variant="secondary" className="tabular-nums">
          Tổng: {items.length} dòng
        </Badge>
      </div>

      {/* Table Container */}
      <div className="max-h-[360px] flex-1 overflow-auto md:max-h-none">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
              <FileText className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Chưa có dữ liệu xem trước
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Dán danh sách từ vựng vào khung bên trái để xem trước kết quả tách cột.
            </p>
          </div>
        ) : (
          <div className="min-w-[760px] divide-y divide-border/60">
            {/* Table Header */}
            <div className="sticky top-0 z-10 grid grid-cols-[36px_1fr_1.1fr_0.8fr_0.7fr_1.8fr_0.9fr_44px] bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-xs select-none">
              <span>#</span>
              <span>Từ vựng *</span>
              <span>Ý nghĩa *</span>
              <span>IPA</span>
              <span>Từ loại</span>
              <span>Ví dụ & Nghĩa ví dụ</span>
              <span>Đồng nghĩa</span>
              <span className="text-center">TT</span>
            </div>

            {/* Table Rows */}
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-[36px_1fr_1.1fr_0.8fr_0.7fr_1.8fr_0.9fr_44px] items-center px-3 py-2.5 text-xs transition-colors",
                  item.isValid
                    ? "hover:bg-muted/30"
                    : "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <span className="font-mono text-[11px] font-medium text-muted-foreground tabular-nums select-none">
                  {index + 1}
                </span>

                <span
                  className={cn(
                    "truncate pr-2 font-semibold",
                    item.word
                      ? "text-foreground"
                      : "italic text-destructive text-[11px]"
                  )}
                >
                  {item.word || "(Thiếu từ)"}
                </span>

                <span
                  className={cn(
                    "truncate pr-2 font-medium",
                    item.meaning
                      ? "text-foreground/90"
                      : "italic text-destructive text-[11px]"
                  )}
                >
                  {item.meaning || "(Thiếu nghĩa)"}
                </span>

                <span className="truncate pr-2 font-mono text-[11px] text-muted-foreground">
                  {item.ipa || "—"}
                </span>

                <span className="truncate pr-2 text-muted-foreground">
                  {getPosLabel(item.partOfSpeech)}
                </span>

                <div className="pr-2 space-y-0.5">
                  {item.example ? (
                    <p className="italic text-muted-foreground leading-snug">
                      &ldquo;
                      <HighlightedSentence
                        sentence={item.example}
                        type="en"
                        targetWord={item.word}
                      />
                      &rdquo;
                    </p>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                  {item.example_translation ? (
                    <p className="text-[11px] text-muted-foreground/80 leading-snug">
                      <HighlightedSentence
                        sentence={item.example_translation}
                        type="vi"
                        meaning={item.meaning}
                      />
                    </p>
                  ) : null}
                </div>

                <span className="truncate pr-2 text-muted-foreground">
                  {item.synonyms || "—"}
                </span>

                <div className="flex justify-center select-none">
                  {item.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation Summary Footer */}
      {items.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-muted/30 px-4 py-2.5 text-xs font-medium select-none">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Hợp lệ: {validCount} từ</span>
          </div>

          {invalidCount > 0 && (
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Chưa đủ thông tin: {invalidCount} dòng</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
