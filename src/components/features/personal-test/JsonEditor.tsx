"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SAMPLE_VOCABEE_TEST } from "@/lib/personal-test/sample-test";
import { Code, Sparkles, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  onValidate: () => void;
  isValidating?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  onValidate,
  isValidating = false,
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value ? value.split("\n") : [""];
  const lineCount = Math.max(lines.length, 1);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFormat = () => {
    if (!value.trim()) {
      toast.error("Vui lòng nhập JSON trước khi định dạng");
      return;
    }
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      toast.success("Đã định dạng JSON thành công");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cú pháp JSON không hợp lệ";
      toast.error(`Lỗi cú pháp: ${msg}`);
    }
  };

  const handleClear = () => {
    onChange("");
    toast.info("Đã xóa nội dung trình soạn thảo");
  };

  const handleLoadSample = () => {
    const formatted = JSON.stringify(SAMPLE_VOCABEE_TEST, null, 2);
    onChange(formatted);
    toast.success("Đã tải dữ liệu mẫu Vocabee Test v1");
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-mono">
          <Code className="h-4 w-4 text-primary" />
          <span>JSON Editor</span>
          <span className="text-muted-foreground/60">•</span>
          <span>{lineCount} dòng</span>
          <span className="text-muted-foreground/60">•</span>
          <span>{value.length} ký tự</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            className="h-7 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Tải mẫu</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={!value.trim()}
            className="h-7 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
            <span>Format JSON</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!value.trim()}
            className="h-7 text-xs gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onValidate}
            disabled={!value.trim() || isValidating}
            className="h-7 text-xs gap-1.5 cursor-pointer font-medium ml-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isValidating ? "Đang kiểm tra..." : "Kiểm tra JSON"}</span>
          </Button>
        </div>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="relative flex h-[360px] md:h-[420px] font-mono text-[13px] leading-relaxed bg-muted/15 dark:bg-zinc-950/40">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 shrink-0 select-none overflow-hidden border-r border-border/60 bg-muted/30 py-3 text-right pr-3 text-muted-foreground/50 font-mono text-xs"
        >
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx} className="leading-relaxed">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder='Dán nội dung JSON theo schema vocabee-test-v1 vào đây... (Hoặc bấm "Tải mẫu" ở thanh công cụ)'
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden overflow-y-auto whitespace-pre tab-[2]"
        />
      </div>
    </div>
  );
}
