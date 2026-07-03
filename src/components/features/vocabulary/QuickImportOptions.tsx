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
  const setOption = <K extends keyof ParseOptions>(key: K, value: ParseOptions[K]) => {
    onChangeOptions({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4 py-1 text-xs select-none">
      {/* 1. Term delimiter (between word and meaning) */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Ngăn cách giữa từ vựng và định nghĩa
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Ký tự Tab", value: "tab" as const },
            { label: "Dấu phẩy ( , )", value: "comma" as const },
            { label: "Tùy chỉnh", value: "custom" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={isPending}
              onClick={() => setOption("termDelimiter", item.value)}
              className={cn(
                "h-8 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                options.termDelimiter === item.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-background text-muted-foreground border-[#E5E7EB] dark:border-border/60 hover:bg-muted/70"
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
            className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background border-0 text-xs rounded-xl focus:ring-1 focus:ring-primary/25 focus:outline-none transition-all mt-1.5"
          />
        )}
      </div>

      {/* 2. Card delimiter (between elements/lines) */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Ngăn cách giữa các thẻ từ vựng
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Xuống dòng (Enter)", value: "newline" as const },
            { label: "Dấu chấm phẩy ( ; )", value: "semicolon" as const },
            { label: "Tùy chỉnh", value: "custom" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={isPending}
              onClick={() => setOption("cardDelimiter", item.value)}
              className={cn(
                "h-8 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                options.cardDelimiter === item.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-background text-muted-foreground border-[#E5E7EB] dark:border-border/60 hover:bg-muted/70"
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
            className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background border-0 text-xs rounded-xl focus:ring-1 focus:ring-primary/25 focus:outline-none transition-all mt-1.5"
          />
        )}
      </div>
    </div>
  );
}
