"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { ParseOptions } from "./QuickImportParser";
import { cn } from "@/lib/utils";

interface QuickImportOptionsProps {
  options: ParseOptions;
  onChangeOptions: (opts: ParseOptions) => void;
  isPending: boolean;
}

export function QuickImportOptions({
  options,
  onChangeOptions,
  isPending,
}: QuickImportOptionsProps) {
  const setOption = <K extends keyof ParseOptions>(
    key: K,
    value: ParseOptions[K]
  ) => {
    onChangeOptions({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs select-none sm:grid-cols-2">
      {/* 1. Term delimiter */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          Ngăn cách giữa các trường
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Tab", value: "tab" as const },
            { label: "Dấu phẩy (,)", value: "comma" as const },
            { label: "Tùy chỉnh", value: "custom" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={isPending}
              onClick={() => setOption("termDelimiter", item.value)}
              className={cn(
                "h-7.5 rounded-lg border px-2.5 text-xs font-medium transition-all cursor-pointer",
                options.termDelimiter === item.value
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {options.termDelimiter === "custom" && (
          <input
            type="text"
            maxLength={10}
            placeholder="Nhập ký tự ngăn cách..."
            value={options.customTermDelimiter}
            disabled={isPending}
            onChange={(e) => setOption("customTermDelimiter", e.target.value)}
            className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          />
        )}
      </div>

      {/* 2. Card delimiter */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          Ngăn cách giữa các thẻ
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Xuống dòng", value: "newline" as const },
            { label: "Chấm phẩy (;)", value: "semicolon" as const },
            { label: "Tùy chỉnh", value: "custom" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={isPending}
              onClick={() => setOption("cardDelimiter", item.value)}
              className={cn(
                "h-7.5 rounded-lg border px-2.5 text-xs font-medium transition-all cursor-pointer",
                options.cardDelimiter === item.value
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {options.cardDelimiter === "custom" && (
          <input
            type="text"
            maxLength={10}
            placeholder="Nhập ký tự ngăn cách..."
            value={options.customCardDelimiter}
            disabled={isPending}
            onChange={(e) => setOption("customCardDelimiter", e.target.value)}
            className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          />
        )}
      </div>
    </div>
  );
}
