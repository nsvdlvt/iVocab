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
    <div className="flex min-h-[210px] flex-1 flex-col space-y-1.5">
      <Label
        htmlFor="import-area"
        className="text-xs font-semibold text-foreground"
      >
        Dán dữ liệu nguồn vào đây
      </Label>
      <textarea
        id="import-area"
        placeholder={`Ví dụ:\nability\tkhả năng\t/əˈbɪl.ə.ti/\tnoun\ncreative\tsáng tạo\t/kriˈeɪ.tɪv/\tadjective`}
        value={text}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={isPending}
        className="min-h-[175px] w-full flex-1 resize-none rounded-xl border border-input bg-background p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/55 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      />
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground select-none">
        <span>Mỗi dòng tương ứng với 1 thẻ từ vựng</span>
        <span>Hỗ trợ bảng Markdown, Excel, Quizlet</span>
      </div>
    </div>
  );
}
