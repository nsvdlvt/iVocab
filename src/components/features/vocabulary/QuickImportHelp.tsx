"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

export function QuickImportHelp() {
  return (
    <div className="border border-[#E5E7EB] dark:border-border/60 bg-muted/20 dark:bg-muted/10 rounded-2xl p-4.5 space-y-3.5 text-xs select-none">
      <div className="flex items-center gap-2 text-primary font-bold">
        <HelpCircle className="h-4 w-4" />
        Định dạng nhập liệu hỗ trợ (Mới)
      </div>
      <div className="space-y-2 text-muted-foreground leading-relaxed">
        <p>
          Hệ thống hỗ trợ tự động tách từ vựng thành 6 trường dữ liệu chuẩn. Ngăn cách các trường bằng phím <kbd className="px-1 py-0.5 bg-muted border rounded-md text-[9px] font-mono shadow-xs">Tab</kbd> hoặc dấu ngăn cách bạn cấu hình phía trên.
        </p>
        <div className="space-y-1">
          <span className="font-bold block text-[10px] text-foreground/80 uppercase">Ví dụ chuẩn (6 cột):</span>
          <pre className="p-2.5 bg-background dark:bg-card border rounded-xl font-mono text-[9px] text-foreground leading-normal overflow-x-auto select-all">
{`ability\tkhả năng\t/əˈbɪləti/\tnoun\tShe has great ability.\tskill,capacity`}
          </pre>
        </div>
        <div className="space-y-1 text-[11px]">
          <span className="font-bold block text-[10px] text-foreground/80">Thứ tự nhận diện:</span>
          <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
            <li>Từ vựng (Bắt buộc)</li>
            <li>Ý nghĩa (Bắt buộc)</li>
            <li>Phiên âm IPA</li>
            <li>Từ loại (noun, verb, adjective, adverb...)</li>
            <li>Câu ví dụ tiếng Anh</li>
            <li>Từ đồng nghĩa (Ngăn cách bằng dấu phẩy)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
