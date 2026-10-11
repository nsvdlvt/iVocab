"use client";

import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VocabularyInfoCardProps {
  title: string;
  onChangeTitle: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  isPending: boolean;
  error?: string;
}

function VocabularyInfoCardComponent({
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  isPending,
  error,
}: VocabularyInfoCardProps) {
  return (
    <div className="w-full rounded-xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor="vocab-title"
          className="text-xs font-semibold text-foreground"
        >
          Tiêu đề bộ từ vựng <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vocab-title"
          type="text"
          placeholder="Ví dụ: 3000 từ vựng Oxford thông dụng, IELTS Academic Band 7.0+..."
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          disabled={isPending}
          aria-invalid={!!error}
          className={cn(
            "h-10 rounded-lg text-sm font-medium",
            error && "border-destructive ring-1 ring-destructive/20"
          )}
        />
        {error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="vocab-desc"
          className="text-xs font-semibold text-foreground"
        >
          Mô tả ngắn{" "}
          <span className="font-normal text-muted-foreground">(Tùy chọn)</span>
        </Label>
        <Input
          id="vocab-desc"
          type="text"
          placeholder="Ghi chú mục tiêu học tập, chủ đề hoặc nguồn tài liệu tham khảo..."
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          disabled={isPending}
          className="h-9 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}

export const VocabularyInfoCard = memo(VocabularyInfoCardComponent);
