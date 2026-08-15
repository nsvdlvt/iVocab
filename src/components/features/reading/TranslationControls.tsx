"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";

export function TranslationControls({
  showTranslation,
  onToggle,
}: {
  showTranslation: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-foreground">Hiển thị dịch</div>
        <div className="text-xs text-muted-foreground">Bật hoặc tắt bản dịch mà không reload bài đọc.</div>
      </div>
      <Switch checked={showTranslation} onCheckedChange={onToggle} ariaLabel="Bật tắt dịch" />
    </div>
  );
}
