"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Sparkles,
  UploadCloud,
  X,
  FileImage,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AIVocabItem } from "@/lib/ai/import-vocabulary";
import { AIImportPreview } from "./AIImportPreview";
import { cn } from "@/lib/utils";

interface AIImportDialogProps {
  onImport: (newCards: AIVocabItem[]) => void;
  existingWords: Array<{ word: string; meaning: string }>;
  isPending: boolean;
}

const SUGGESTIONS = [
  "IELTS Environment",
  "TOEIC Business",
  "Travel Vocabulary",
  "Food & Dining",
  "Technology Terms",
  "Academic Vocabulary",
  "Phrasal Verbs",
  "Idioms",
  "B2 Level Vocabulary",
  "C1 Writing Task 2",
];

const VALID_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
]);
const MAX_IMAGE_DIMENSION = 1600;

export function AIImportDialog({
  onImport,
  existingWords,
  isPending,
}: AIImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatPrompt, setChatPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importedItems, setImportedItems] = useState<AIVocabItem[] | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPendingImport, startImportTransition] = useTransition();

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSuggestionClick = (suggestion: string) => {
    setChatPrompt(`Cho tôi danh sách từ vựng về chủ đề: ${suggestion}`);
  };

  const handleFileSelection = async (file: File) => {
    if (!VALID_IMAGE_TYPES.has(file.type)) {
      toast.error("Chỉ chấp nhận ảnh PNG, JPG, JPEG, WEBP.");
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelection(file);
    }
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const resizeImageIfNeeded = async (file: File): Promise<string> => {
    const imageBitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height)
    );
    const width = Math.max(1, Math.round(imageBitmap.width * scale));
    const height = Math.max(1, Math.round(imageBitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Không thể xử lý ảnh.");
    }

    ctx.drawImage(imageBitmap, 0, 0, width, height);
    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = mimeType === "image/png" ? undefined : 0.88;
    return canvas.toDataURL(mimeType, quality);
  };

  const parseImportResponse = async (res: Response) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        data?.error || "Không thể tạo danh sách từ vựng. Vui lòng thử lại."
      );
    }
    return data;
  };

  const handleGenerate = () => {
    if (isProcessing || isPendingImport) return;

    if (activeTab === "chat" && !chatPrompt.trim()) {
      toast.error("Vui lòng nhập mô tả chủ đề từ vựng cần tạo.");
      return;
    }
    if (activeTab === "image" && !imageFile) {
      toast.error("Vui lòng tải lên một hình ảnh.");
      return;
    }

    setIsProcessing(true);
    startImportTransition(async () => {
      try {
        let responseData: {
          success?: boolean;
          data?: AIVocabItem[];
          error?: string;
        };

        if (activeTab === "chat") {
          const res = await fetch("/api/ai/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: chatPrompt.trim() }),
          });
          responseData = await parseImportResponse(res);
        } else {
          const image = await resizeImageIfNeeded(imageFile!);
          const res = await fetch("/api/ai/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: "Trích xuất và chuẩn hoá từ vựng từ hình ảnh.",
              image,
            }),
          });
          responseData = await parseImportResponse(res);
        }

        if (
          responseData.success &&
          Array.isArray(responseData.data) &&
          responseData.data.length > 0
        ) {
          setImportedItems(responseData.data);
          toast.success("AI đã tạo và chuẩn hóa từ vựng thành công!");
          return;
        }

        toast.error(
          responseData.error ||
            "Không thể tạo danh sách từ vựng. Vui lòng thử lại."
        );
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Lỗi kết nối máy chủ. Vui lòng thử lại."
        );
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-1.5 rounded-lg border-primary/25 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
      disabled={isPending}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>AI Import</span>
    </Button>
  );

  const resetAndClose = () => {
    setIsOpen(false);
    setImportedItems(null);
    setChatPrompt("");
    handleRemoveImage();
  };

  const mainContent = (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {isProcessing || isPendingImport ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-5 py-12 select-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-primary/25" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-sm font-semibold text-foreground">
              AI đang phân tích và chuẩn hóa từ vựng...
            </h3>
            <p className="max-w-xs text-xs text-muted-foreground">
              Tự động bổ sung phiên âm IPA, từ loại, ví dụ ngữ cảnh và từ đồng nghĩa.
            </p>
          </div>
          <div className="w-full max-w-md space-y-2.5 px-6 opacity-60">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-dashed border-border/80 bg-card/50 p-3.5"
              >
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : importedItems ? (
        <AIImportPreview
          items={importedItems}
          existingWords={existingWords}
          onImport={(finalItems) => {
            onImport(finalItems);
            resetAndClose();
          }}
          onCancel={() => setImportedItems(null)}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-0.5">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col gap-4"
          >
            <TabsList className="grid h-10 w-full shrink-0 grid-cols-2 rounded-xl bg-muted/60 p-1 select-none">
              <TabsTrigger
                value="chat"
                className="flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Tạo theo chủ đề (AI Prompt)</span>
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <FileImage className="h-3.5 w-3.5" />
                <span>Quét từ hình ảnh (OCR)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="chat"
              className="flex flex-1 flex-col gap-4 focus-visible:outline-none"
            >
              <div className="space-y-1.5 select-none">
                <Label className="text-xs font-semibold text-foreground">
                  Mô tả chủ đề hoặc dán đoạn văn tiếng Anh
                </Label>
                <textarea
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ví dụ: Cho tôi 15 từ vựng IELTS Band 7.5 chủ đề Environment & Climate Change..."
                  className="min-h-[130px] w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/55 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2 select-none">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gợi ý chủ đề phổ biến
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isProcessing}
                      className="rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary cursor-pointer disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="image"
              className="flex flex-1 flex-col gap-4 focus-visible:outline-none"
            >
              {!imagePreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "flex min-h-[230px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/35"
                  )}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Kéo thả hình ảnh vào đây hoặc nhấn để chọn tệp
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hỗ trợ ảnh chụp trang sách, bảng từ vựng hoặc ghi chú (PNG, JPG, WEBP)
                  </p>
                </div>
              ) : (
                <div className="relative flex min-h-[230px] flex-1 flex-col items-center justify-center rounded-xl border border-border/80 bg-muted/15 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-[220px] max-w-full rounded-lg object-contain shadow-xs"
                  />
                  <div className="absolute right-2.5 top-2.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      onClick={handleRemoveImage}
                      className="h-7 w-7 rounded-full shadow-xs"
                      disabled={isProcessing}
                      aria-label="Xóa ảnh"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-border/80 pt-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetAndClose}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="gap-1.5 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phân tích & Tạo từ vựng</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger render={triggerButton} />
        <SheetContent
          side="bottom"
          className="flex h-[92vh] flex-col rounded-t-2xl border-border/80 bg-background p-4"
        >
          <SheetHeader className="mb-2 shrink-0 border-b border-border/80 pb-3">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Vocabulary Import</span>
            </SheetTitle>
          </SheetHeader>
          {mainContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={triggerButton} />
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-[960px] flex-col gap-4 overflow-hidden rounded-xl border border-border/80 bg-background p-6">
        <DialogHeader className="shrink-0 border-b border-border/80 pb-3.5 select-none">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Vocabulary Import</span>
          </DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tạo danh sách từ vựng theo chủ đề hoặc trích xuất OCR từ hình ảnh, tự động điền phiên âm, từ loại và ví dụ.
          </p>
        </DialogHeader>
        {mainContent}
      </DialogContent>
    </Dialog>
  );
}
