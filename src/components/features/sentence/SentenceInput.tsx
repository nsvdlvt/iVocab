"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, RefreshCw, Sparkles } from "lucide-react";

interface SentenceInputProps {
  word: string;
  disabled: boolean;
  loading: boolean;
  onSubmit: (sentence: string) => void;
  onHint: () => void;
  onExample: () => void;
  hintDisabled: boolean;
  hintLabel: string;
  exampleDisabled: boolean;
  exampleLabel: string;
}

export function SentenceInput({
  word,
  disabled,
  loading,
  onSubmit,
  onHint,
  onExample,
  hintDisabled,
  hintLabel,
  exampleDisabled,
  exampleLabel,
}: SentenceInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when word changes or resets
  useEffect(() => {
    if (!disabled && !loading) {
      textareaRef.current?.focus();
    }
  }, [disabled, loading, word]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim().length > 0) {
        onSubmit(value.trim());
      }
    }
  };

  const handleClear = () => {
    setValue("");
    textareaRef.current?.focus();
  };

  const isAnotherExample = exampleLabel.toLowerCase().includes("another");

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Viết câu với từ mục tiêu</span>
        </h3>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Nhấn <kbd>Enter</kbd> để chấm điểm
        </span>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          disabled={disabled || loading}
          className="w-full min-h-[140px] p-4 pb-9 text-base bg-muted/20 border border-border/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all duration-150 placeholder:text-muted-foreground/60 text-foreground leading-relaxed"
          placeholder={`Viết một câu tiếng Anh tự nhiên sử dụng từ '${word}'...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />
        {/* Character counter */}
        <div className="absolute bottom-3 right-3.5 text-xs font-mono text-muted-foreground bg-background/80 border border-border/60 px-2 py-0.5 rounded-md select-none tabular-nums">
          {value.length}/500
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 select-none">
        {/* AI Assistant pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onHint}
            disabled={disabled || loading || hintDisabled}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              hintDisabled
                ? "bg-muted/40 text-muted-foreground border-border"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/15"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{hintLabel}</span>
          </button>

          <button
            type="button"
            onClick={onExample}
            disabled={disabled || loading || exampleDisabled}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              exampleDisabled
                ? "bg-muted/40 text-muted-foreground border-border"
                : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            }`}
          >
            {isAnotherExample ? <RefreshCw className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            <span>{exampleLabel}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={handleClear}
            disabled={disabled || loading || value.length === 0}
            className="rounded-xl px-4 h-10 hover:bg-muted/60 text-xs font-semibold cursor-pointer"
          >
            Xóa
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(value.trim())}
            disabled={disabled || loading || value.trim().length === 0}
            className="rounded-xl px-5 h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? "Đang chấm..." : "Chấm điểm AI"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
