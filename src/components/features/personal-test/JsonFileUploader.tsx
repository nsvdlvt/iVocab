"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileCode2, X, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface JsonFileUploaderProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onClear: () => void;
  currentFileName?: string;
  currentFileSize?: number;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function JsonFileUploader({
  onFileLoaded,
  onClear,
  currentFileName,
  currentFileSize,
}: JsonFileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // 1. Check extension and MIME type
    const isJsonExt = file.name.toLowerCase().endsWith(".json");
    const isJsonMime = file.type === "application/json" || file.type === "";
    if (!isJsonExt && !isJsonMime) {
      const err = "Tệp không đúng định dạng. Chỉ chấp nhận tệp có phần mở rộng .json.";
      setError(err);
      toast.error(err);
      return;
    }

    // 2. Check file size
    if (file.size > MAX_FILE_SIZE) {
      const err = `Kích thước tệp quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Giới hạn tối đa là 2MB.`;
      setError(err);
      toast.error(err);
      return;
    }

    // 3. Read content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        try {
          // Quick parse check to ensure valid JSON syntax
          JSON.parse(text);
          onFileLoaded(text, file.name);
          toast.success(`Đã đọc tệp "${file.name}" thành công.`);
        } catch (jsonErr) {
          const msg = jsonErr instanceof Error ? jsonErr.message : "Cú pháp JSON không hợp lệ";
          setError(`Lỗi cú pháp tệp JSON: ${msg}`);
          toast.error("Tệp chứa cú pháp JSON không hợp lệ");
        }
      }
    };

    reader.onerror = () => {
      const err = "Không thể đọc nội dung tệp. Vui lòng thử lại.";
      setError(err);
      toast.error(err);
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleInputChange}
        className="hidden"
      />

      {currentFileName ? (
        // File Loaded View
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCode2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {currentFileName}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentFileSize ? formatBytes(currentFileSize) : "Tệp JSON hợp lệ"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 gap-1.5 text-xs cursor-pointer font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thay tệp khác</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Dropzone View
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            Kéo thả tệp JSON vào đây, hoặc nhấn để duyệt
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Chỉ hỗ trợ tệp định dạng .json với dung lượng tối đa 2MB. Tệp sẽ được phân tích trực tiếp trên trình duyệt của bạn.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 h-8 text-xs cursor-pointer font-medium"
          >
            Chọn tệp từ máy tính
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}
