"use client";

import React from "react";
import { Check, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewControls() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl mx-auto">
      {/* Incorrect Button */}
      <Button
        variant="outline"
        className="rounded-xl border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
      >
        <X className="h-4 w-4" />
        Chưa thuộc
      </Button>

      {/* Flip helper (mock) */}
      <Button
        variant="secondary"
        className="rounded-xl gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 bg-muted/60 text-muted-foreground hover:bg-muted"
      >
        <RotateCw className="h-4 w-4" />
        Lật thẻ
      </Button>

      {/* Correct Button */}
      <Button
        variant="outline"
        className="rounded-xl border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
      >
        <Check className="h-4 w-4" />
        Đã thuộc
      </Button>
    </div>
  );
}
