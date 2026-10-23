"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

export function QuickImportHelp() {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5 text-xs select-none">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <HelpCircle className="h-3.5 w-3.5 text-primary" />
        <span>Định dạng nhập liệu hỗ trợ (tối đa 7 cột hoặc bảng Markdown)</span>
      </div>
      <div className="space-y-2 text-muted-foreground leading-relaxed">
        <p className="text-[11px]">
          Ngăn cách các cột bằng phím <kbd>Tab</kbd> hoặc dán trực tiếp bảng Markdown từ AI:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background p-2.5 font-mono text-[10px] text-foreground select-all">
          {`reluctant\tmiễn cưỡng\t/rɪˈlʌk.tənt/\tadjective\tShe was reluctant to share.\tCô ấy miễn cưỡng chia sẻ.\thesitant`}
        </pre>
        <p className="text-[11px] text-muted-foreground">
          Thứ tự cột: <strong className="text-foreground">1. Từ vựng*</strong> •{" "}
          <strong className="text-foreground">2. Ý nghĩa*</strong> • 3. IPA • 4. Từ loại • 5. Câu ví dụ • 6. Nghĩa của ví dụ • 7. Từ đồng nghĩa
        </p>
      </div>
    </div>
  );
}
