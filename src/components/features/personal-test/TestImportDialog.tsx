"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JsonEditor } from "./JsonEditor";
import { JsonFileUploader } from "./JsonFileUploader";
import { ValidationResultView } from "./ValidationResultView";
import { TestPreview } from "./TestPreview";
import { validateVocabeeTestJson } from "@/lib/personal-test/vocabee-test-validator";
import { savePersonalTestAction } from "@/actions/personal-test";
import { ValidationResult, VocabeeTest } from "@/types/vocabee-test";
import { Code, UploadCloud, Eye, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TestImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "paste" | "upload";
}

export function TestImportDialog({
  open,
  onOpenChange,
  defaultTab = "paste",
}: TestImportDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"paste" | "upload">(defaultTab);
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleValidate = () => {
    if (!jsonText.trim()) {
      toast.error("Vui lòng nhập hoặc tải tệp JSON trước khi kiểm tra");
      return;
    }

    setIsValidating(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = validateVocabeeTestJson(parsed);
      setValidationResult(res);

      if (res.valid) {
        toast.success("Dữ liệu JSON hợp lệ! Bạn có thể xem trước hoặc lưu bài kiểm tra.");
      } else {
        toast.error(`Phát hiện ${res.errors.length} lỗi trong cấu trúc JSON`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cú pháp JSON không hợp lệ";
      setValidationResult({
        valid: false,
        errors: [
          {
            path: "Cú pháp JSON (Syntax)",
            message: msg,
            expected: "Cú pháp JSON hợp lệ",
            found: "Lỗi phân tích chuỗi JSON",
            suggestion: "Kiểm tra lại các dấu ngoặc {}, [], dấu phẩy thừa hoặc thiếu trong văn bản.",
          },
        ],
      });
      toast.error("JSON chứa lỗi cú pháp không thể phân tích");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileLoaded = (content: string, name: string) => {
    setJsonText(content);
    setFileName(name);
    setFileSize(new Blob([content]).size);
    // Auto validate after upload
    try {
      const parsed = JSON.parse(content);
      const res = validateVocabeeTestJson(parsed);
      setValidationResult(res);
      if (res.valid) {
        toast.success(`Đã kiểm tra tệp "${name}" thành công!`);
      }
    } catch {
      handleValidate();
    }
  };

  const handleClearFile = () => {
    setJsonText("");
    setFileName(undefined);
    setFileSize(undefined);
    setValidationResult(null);
  };

  const handleConfirmSave = async () => {
    if (!validationResult || !validationResult.valid) {
      toast.error("Chỉ có thể lưu khi dữ liệu JSON đã được kiểm tra hợp lệ");
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePersonalTestAction(validationResult.data);
      if (res.success) {
        toast.success("Đã tạo bài kiểm tra cá nhân thành công!");
        onOpenChange(false);
        // Reset states
        setIsPreviewing(false);
        setJsonText("");
        setValidationResult(null);
        router.push(`/u/personal-test/${res.testId}`);
      } else {
        toast.error(res.error || "Không thể lưu bài kiểm tra. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi lưu bài kiểm tra");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Tạo bài kiểm tra cá nhân (Personal Test)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Nhập hoặc tải tệp JSON theo chuẩn schema <code className="font-mono text-primary">vocabee-test-v1</code> để tự động khởi tạo giao diện bài tập tương tác 4 kỹ năng.
          </DialogDescription>
        </DialogHeader>

        {isPreviewing && validationResult?.valid ? (
          <TestPreview
            test={validationResult.data}
            onBack={() => setIsPreviewing(false)}
            onConfirmSave={handleConfirmSave}
            isSaving={isSaving}
          />
        ) : (
          <div className="space-y-4 pt-2">
            {/* Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-border/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "paste"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Dán mã JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Tải tệp JSON</span>
              </button>
            </div>

            {/* Tab 1: Paste JSON */}
            {activeTab === "paste" && (
              <JsonEditor
                value={jsonText}
                onChange={(val) => {
                  setJsonText(val);
                  if (validationResult) setValidationResult(null);
                }}
                onValidate={handleValidate}
                isValidating={isValidating}
              />
            )}

            {/* Tab 2: Upload File */}
            {activeTab === "upload" && (
              <JsonFileUploader
                onFileLoaded={handleFileLoaded}
                onClear={handleClearFile}
                currentFileName={fileName}
                currentFileSize={fileSize}
              />
            )}

            {/* Validation Result View */}
            <ValidationResultView result={validationResult} />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer text-xs"
              >
                Hủy bỏ
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={!jsonText.trim() || isValidating}
                  className="cursor-pointer text-xs font-medium"
                >
                  {isValidating ? "Đang kiểm tra..." : "Kiểm tra tính hợp lệ"}
                </Button>

                {validationResult?.valid && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewing(true)}
                      className="cursor-pointer text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Xem trước bài tập</span>
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleConfirmSave}
                      disabled={isSaving}
                      className="cursor-pointer text-xs font-semibold gap-1.5 shadow-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSaving ? "Đang lưu..." : "Lưu & Bắt đầu ngay"}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
