// src/components/features/vocabulary/AIImportDialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, UploadCloud, X, FileImage, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AIVocabItem } from "@/lib/ai/import-vocabulary";
import { AIImportPreview } from "./AIImportPreview";

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
  "C1 Writing Task 2"
];

export function AIImportDialog({ onImport, existingWords, isPending }: AIImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatPrompt, setChatPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [isPendingImport, startImportTransition] = useTransition();
  const [importedItems, setImportedItems] = useState<AIVocabItem[] | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSuggestionClick = (suggestion: string) => {
    setChatPrompt(`Cho tôi từ vựng về chủ đề: ${suggestion}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận các định dạng ảnh: PNG, JPG, JPEG, WEBP.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận các định dạng ảnh: PNG, JPG, JPEG, WEBP.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGenerate = () => {
    if (activeTab === "chat" && !chatPrompt.trim()) {
      toast.error("Vui lòng nhập mô tả chủ đề từ vựng cần tạo.");
      return;
    }
    if (activeTab === "image" && !imageFile) {
      toast.error("Vui lòng tải lên một hình ảnh.");
      return;
    }

    startImportTransition(async () => {
      try {
        let responseData;
        if (activeTab === "chat") {
          const res = await fetch("/api/ai/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: chatPrompt }),
          });
          responseData = await res.json();
        } else {
          const formData = new FormData();
          formData.append("prompt", "Trích xuất từ vựng từ hình ảnh.");
          formData.append("file", imageFile!);

          const res = await fetch("/api/ai/import", {
            method: "POST",
            body: formData,
          });
          responseData = await res.json();
        }

        if (responseData.success) {
          setImportedItems(responseData.data);
          toast.success("AI đã tạo và chuẩn hóa từ vựng thành công!");
        } else {
          toast.error(responseData.error || "Không thể tạo danh sách từ vựng. Vui lòng thử lại.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      }
    });
  };

  const triggerButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-xl h-9 text-xs font-semibold gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer min-h-[44px] md:min-h-0"
      disabled={isPending}
    >
      <Sparkles className="h-3.5 w-3.5" />
      ✨ AI Import
    </Button>
  );

  const mainContent = (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {isPendingImport ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12 select-none">
          <div className="relative flex items-center justify-center">
            <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-400 opacity-25"></div>
            <div className="relative rounded-full h-16 w-16 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-blue-500 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-sm font-bold text-foreground">AI đang xử lý từ vựng của bạn...</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Quá trình này bao gồm trích xuất từ vựng và tự động chuẩn hóa (chuyển về nguyên mẫu, sửa lỗi chính tả).
            </p>
          </div>
          {/* Skeleton Cards loader simulation */}
          <div className="w-full max-w-lg space-y-3 px-6 opacity-60">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-dashed border-border rounded-xl bg-card/50 flex flex-col gap-2">
                <div className="h-4 bg-muted rounded-md w-1/3 animate-pulse"></div>
                <div className="h-3 bg-muted rounded-md w-2/3 animate-pulse"></div>
                <div className="h-3 bg-muted rounded-md w-1/2 animate-pulse"></div>
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
            setIsOpen(false);
            setImportedItems(null);
            setChatPrompt("");
            setImageFile(null);
            setImagePreview(null);
          }}
          onCancel={() => setImportedItems(null)}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col gap-4">
            <TabsList className="w-full grid grid-cols-2 rounded-xl h-10 select-none bg-muted/60 p-1 shrink-0">
              <TabsTrigger value="chat" className="text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5">
                <FileImage className="h-3.5 w-3.5" />
                Image Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col gap-4 focus-visible:outline-none">
              <div className="space-y-2 select-none">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Bạn muốn học từ vựng gì hôm nay?</label>
                <textarea
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ví dụ: Cho tôi từ vựng IELTS về chủ đề Environment..."
                  className="w-full min-h-[120px] p-3 text-xs bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-xl border border-border/60 text-foreground placeholder:text-muted-foreground/45 transition-all focus:ring-1 focus:ring-primary/20 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2 select-none">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Gợi ý chủ đề nhanh</label>
                <div className="flex flex-wrap gap-2.5">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-muted/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer border border-border/20 text-muted-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="flex-1 flex flex-col gap-4 focus-visible:outline-none">
              {!imagePreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`flex-1 min-h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-all duration-200 ${
                    dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30 bg-muted/20"
                  }`}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground">Kéo thả ảnh vào đây hoặc bấm để chọn</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Hỗ trợ PNG, JPG, JPEG, WEBP</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-border/60 bg-muted/10 rounded-2xl relative min-h-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-[200px] max-w-full rounded-lg object-contain shadow-sm"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleRemoveImage}
                      className="bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer h-7 w-7"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="shrink-0 flex items-center justify-end pt-4 border-t border-border/30 mt-4 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              className="rounded-xl h-9 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-98 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tạo từ vựng
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
        <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl flex flex-col p-4 bg-background">
          <SheetHeader className="shrink-0 border-b border-border/30 pb-3 mb-2">
            <SheetTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-blue-500" />
              ✨ AI Vocabulary Import
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
      <DialogContent className="max-w-[1000px] w-[95vw] h-[85vh] flex flex-col p-6 rounded-2xl shadow-xl gap-4 border border-border/60 overflow-hidden bg-background">
        <DialogHeader className="shrink-0 border-b border-border/30 pb-3 select-none">
          <DialogTitle className="text-base font-extrabold flex items-center gap-1.5 text-foreground">
            <Sparkles className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            ✨ AI Vocabulary Import
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Nhập nhanh danh sách từ vựng thông qua mô tả hoặc phân tích hình ảnh và chuẩn hóa tự động bằng AI.
          </p>
        </DialogHeader>
        {mainContent}
      </DialogContent>
    </Dialog>
  );
}
