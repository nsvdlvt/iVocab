"use client";

import React, { memo } from "react";
import { ParsedItem } from "./QuickImportParser";
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (!pos) return "-";
    return PART_OF_SPEECH_LABELS[pos.toLowerCase()] || pos;
  };

  return (
    <div className="flex flex-col h-full border border-[#E5E7EB] dark:border-border/60 bg-muted/5 dark:bg-muted/10 rounded-2xl overflow-hidden shadow-2xs">
      {/* Header Info */}
      <div className="px-4 py-3 border-b border-border/30 bg-muted/40 flex justify-between items-center select-none shrink-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Bản xem trước dữ liệu (Word | Meaning | IPA | Type | Example | Synonyms)
        </span>
        <span className="text-[10px] font-extrabold text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
          Tổng cộng: {items.length} dòng
        </span>
      </div>

      {/* Grid Table Container */}
      <div className="flex-1 overflow-auto max-h-[360px] md:max-h-none">
        {items.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground select-none">
            <HelpCircle className="h-8 w-8 opacity-20 mb-2 animate-bounce" />
            <p className="text-xs font-semibold">Chưa có dữ liệu xem trước</p>
            <p className="text-[10px] opacity-75 mt-0.5">Dán dữ liệu cột bên trái để bắt đầu nhận diện.</p>
          </div>
        ) : (
          <div className="min-w-[800px] divide-y divide-border/20">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_1.2fr_1fr_1fr_1.5fr_1.2fr_40px] bg-muted/30 px-3 py-2 text-[10px] font-extrabold text-muted-foreground uppercase select-none sticky top-0 bg-background/90 backdrop-blur-xs z-10">
              <span>#</span>
              <span>Từ vựng *</span>
              <span>Định nghĩa *</span>
              <span>Phiên âm</span>
              <span>Từ loại</span>
              <span>Ví dụ</span>
              <span>Đồng nghĩa</span>
              <span className="text-center">Trạng thái</span>
            </div>

            {/* Table Rows */}
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-[40px_1fr_1.2fr_1fr_1fr_1.5fr_1.2fr_40px] px-3 py-2.5 items-center text-xs transition-colors",
                  item.isValid ? "hover:bg-muted/30" : "bg-rose-500/5 hover:bg-rose-500/10"
                )}
              >
                {/* Index */}
                <span className="font-bold text-muted-foreground select-none">
                  {index + 1}
                </span>

                {/* Word */}
                <span className={cn(
                  "font-bold truncate pr-2",
                  item.word ? "text-foreground" : "text-rose-500 italic text-[11px]"
                )}>
                  {item.word || "(Bắt buộc)"}
                </span>

                {/* Meaning */}
                <span className={cn(
                  "font-medium truncate pr-2",
                  item.meaning ? "text-foreground/80" : "text-rose-500 italic text-[11px]"
                )}>
                  {item.meaning || "(Bắt buộc)"}
                </span>

                {/* IPA */}
                <span className="text-muted-foreground truncate pr-2 font-mono text-[11px]">
                  {item.ipa || "-"}
                </span>

                {/* Part of Speech */}
                <span className="text-muted-foreground truncate pr-2">
                  {getPosLabel(item.partOfSpeech)}
                </span>

                {/* Example */}
                <span className="text-muted-foreground truncate pr-2 italic">
                  {item.example ? `"${item.example}"` : "-"}
                </span>

                {/* Synonyms */}
                <span className="text-muted-foreground truncate pr-2">
                  {item.synonyms || "-"}
                </span>

                {/* Validation Icon */}
                <div className="flex justify-center select-none">
                  {item.isValid ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation Summary Panel */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-border/30 bg-muted/40 select-none shrink-0 text-[11px] font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã nhận diện {validCount} thẻ hợp lệ
          </div>
          {invalidCount > 0 && (
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {invalidCount} dòng không hợp lệ (bị bỏ qua)
            </div>
          )}
        </div>
      )}
    </div>
  );
});
