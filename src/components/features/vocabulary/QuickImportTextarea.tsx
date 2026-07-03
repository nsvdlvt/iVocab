"use client";

import React from "react";
import { Label } from "@/components/ui/label";

interface QuickImportTextareaProps {
  text: string;
  onChangeText: (val: string) => void;
  isPending: boolean;
}

export function QuickImportTextarea({
  text,
  onChangeText,
  isPending,
}: QuickImportTextareaProps) {
  return (
    <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
      <Label htmlFor="import-area" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Dán dữ liệu nguồn vào đây
      </Label>
      <textarea
        id="import-area"
        placeholder={`Ví dụ:\nability\tkhả năng\ncreative\tsáng tạo\nexperience\tkinh nghiệm`}
        value={text}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={isPending}
        className="w-full flex-1 min-h-[180px] p-3 text-xs bg-muted/40 hover:bg-muted/70 focus:bg-background border-0 rounded-2xl focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all resize-none font-mono leading-relaxed"
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 select-none px-1">
        <span>Mỗi dòng tương ứng với 1 thẻ</span>
        <span>Hỗ trợ Copy/Paste trực tiếp</span>
      </div>
    </div>
  );
}
