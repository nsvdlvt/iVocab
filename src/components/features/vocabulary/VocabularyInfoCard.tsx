"use client";

import React from "react";
import { Label } from "@/components/ui/label";

interface VocabularyInfoCardProps {
  title: string;
  onChangeTitle: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  isPending: boolean;
  error?: string;
}

export function VocabularyInfoCard({
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  isPending,
  error,
}: VocabularyInfoCardProps) {
  return (
    <div className="w-full space-y-4 py-6 border-b border-border/40 select-none">
      <div className="space-y-1">
        <Label htmlFor="vocab-title" className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
          Tiêu đề bộ thẻ
        </Label>
        <input
          id="vocab-title"
          type="text"
          placeholder="Ví dụ: 3000 từ vựng Oxford thông dụng..."
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          disabled={isPending}
          className="w-full text-lg sm:text-xl font-bold tracking-tight bg-transparent text-foreground placeholder:text-muted-foreground/50 border-0 p-0 focus:ring-0 focus:outline-none"
        />
        {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="vocab-desc" className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
          Mô tả ngắn
        </Label>
        <input
          id="vocab-desc"
          type="text"
          placeholder="Mục đích hoặc tài liệu tham khảo..."
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          disabled={isPending}
          className="w-full text-sm font-medium bg-transparent text-muted-foreground placeholder:text-muted-foreground/40 border-0 p-0 focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
}
