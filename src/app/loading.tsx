"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 text-foreground"
    >
      <div className="flex flex-col items-center gap-3.5 rounded-3xl border border-border/80 bg-card px-8 py-7 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Đang tải không gian học tập...
          </p>
          <p className="text-xs text-muted-foreground">
            Vui lòng đợi trong giây lát
          </p>
        </div>
      </div>
    </div>
  );
}
