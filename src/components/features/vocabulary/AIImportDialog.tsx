"use client";

import React, { useState, useTransition } from "react";
import {
  Sparkles,
  FileText,
  ListPlus,
  Languages,
  GraduationCap,
  Briefcase,
  Compass,
  BookOpen,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  Check,
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

type ModeType = "topic" | "passage" | "words";

const TOPIC_PRESETS = [
  { label: "IELTS Academic Band 7+", query: "Từ vựng IELTS Academic Band 7.0 - 8.0 cho bài thi Writing & Speaking" },
  { label: "TOEIC Business", query: "Từ vựng TOEIC thông dụng trong môi trường công sở, giao dịch và họp hành" },
  { label: "Giao tiếp hàng ngày", query: "Từ vựng tiếng Anh giao tiếp đời sống thực tế, tự nhiên của người bản xứ" },
  { label: "Du lịch & Nhà hàng", query: "Từ vựng du lịch, đặt phòng khách sạn, gọi món nhà hàng và hỏi đường" },
  { label: "Công nghệ & AI", query: "Từ vựng chuyên ngành công nghệ phần mềm, dữ liệu và trí tuệ nhân tạo (AI)" },
  { label: "Phrasal Verbs phổ biến", query: "Các cụm động từ (Phrasal Verbs) thông dụng nhất trong tiếng Anh giao tiếp" },
  { label: "Môi trường & Khí hậu", query: "Từ vựng chủ đề môi trường, biến đổi khí hậu và phát triển bền vững" },
  { label: "Phỏng vấn xin việc", query: "Từ vựng và cụm từ đắt giá dùng khi trả lời phỏng vấn xin việc tiếng Anh" },
];

const PASSAGE_SAMPLE = `Artificial intelligence is rapidly transforming modern workplaces. Rather than making human workers obsolete, it serves as an indispensable tool that augments cognitive capabilities. Employees who cultivate adaptable skills and technological literacy will thrive in this dynamic landscape.`;

const WORD_LIST_SAMPLE = `meticulous, resilient, ubiquitous, obsolete, ambivalent, pragmatic`;

export function AIImportDialog({
  onImport,
  existingWords,
  isPending,
}: AIImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModeType>("topic");

  // Topic Mode State
  const [topicPrompt, setTopicPrompt] = useState("");
  const [wordCount, setWordCount] = useState<number>(10);
  const [cefrLevel, setCefrLevel] = useState<string>("B1-B2");
  const [tone, setTone] = useState<string>("general");

  // Passage Mode State
  const [passageText, setPassageText] = useState("");

  // Word List Mode State
  const [customWordsText, setCustomWordsText] = useState("");

  // Result & Loading State
  const [importedItems, setImportedItems] = useState<AIVocabItem[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPendingImport, startImportTransition] = useTransition();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleGenerate = () => {
    if (isProcessing || isPendingImport) return;

    let prompt = "";
    if (activeTab === "topic") {
      prompt = topicPrompt.trim();
      if (!prompt) {
        toast.error("Vui lòng nhập chủ đề từ vựng cần tạo hoặc chọn gợi ý bên dưới.");
        return;
      }
    } else if (activeTab === "passage") {
      prompt = passageText.trim();
      if (!prompt) {
        toast.error("Vui lòng dán đoạn văn tiếng Anh cần trích xuất từ vựng.");
        return;
      }
    } else if (activeTab === "words") {
      prompt = customWordsText.trim();
      if (!prompt) {
        toast.error("Vui lòng nhập danh sách từ tiếng Anh cần hoàn thiện.");
        return;
      }
    }

    setIsProcessing(true);
    startImportTransition(async () => {
      try {
        const res = await fetch("/api/ai/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            mode: activeTab,
            count: wordCount,
            level: cefrLevel,
            tone,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(
            data?.error || "Không thể tạo danh sách từ vựng. Vui lòng thử lại."
          );
        }

        if (Array.isArray(data.data) && data.data.length > 0) {
          setImportedItems(data.data);
          toast.success(`AI đã tạo và chuẩn hóa ${data.data.length} từ vựng thành công!`);
          return;
        }

        toast.error(
          data?.error || "Không thể tạo danh sách từ vựng. Vui lòng thử lại với mô tả khác."
        );
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Lỗi kết nối tới máy chủ AI. Vui lòng thử lại."
        );
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setImportedItems(null);
  };

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-1.5 rounded-lg border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition-all duration-150 hover:bg-primary/15 hover:border-primary/50 shadow-2xs"
      disabled={isPending}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>AI Tạo từ vựng</span>
    </Button>
  );

  const mainContent = (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {isProcessing || isPendingImport ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-12 select-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 text-center">
            <h3 className="text-base font-bold text-foreground">
              AI đang phân tích và chuẩn hóa từ vựng...
            </h3>
            <p className="max-w-md text-xs text-muted-foreground">
              Tự động tra cứu phiên âm IPA, dịch nghĩa tiếng Việt súc tích, phân loại từ và tạo câu ví dụ CEFR chuẩn.
            </p>
          </div>

          {/* Stepper info */}
          <div className="flex flex-col gap-2 w-full max-w-sm rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Phân tích nội dung và mục tiêu người học</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Biên soạn nghĩa tiếng Việt & phiên âm IPA chuẩn</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span>Thiết kế câu ví dụ ngữ cảnh và từ đồng nghĩa</span>
            </div>
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as ModeType)}
            className="flex flex-1 flex-col gap-4"
          >
            {/* Tabs List */}
            <TabsList className="grid h-11 w-full shrink-0 grid-cols-3 rounded-xl bg-muted/60 p-1 select-none">
              <TabsTrigger
                value="topic"
                className="flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tạo theo chủ đề</span>
                <span className="sm:hidden">Chủ đề</span>
              </TabsTrigger>

              <TabsTrigger
                value="passage"
                className="flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-2xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trích xuất đoạn văn</span>
                <span className="sm:hidden">Đoạn văn</span>
              </TabsTrigger>

              <TabsTrigger
                value="words"
                className="flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-2xs"
              >
                <ListPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hoàn thiện danh sách</span>
                <span className="sm:hidden">Danh sách</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Theo chủ đề */}
            <TabsContent
              value="topic"
              className="flex flex-1 flex-col gap-4 focus-visible:outline-none"
            >
              <div className="space-y-1.5 select-none">
                <Label className="text-xs font-semibold text-foreground">
                  Chủ đề hoặc mục tiêu học từ vựng
                </Label>
                <textarea
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="Ví dụ: Từ vựng IELTS Speaking & Writing Band 7.5 về biến đổi khí hậu, năng lượng tái tạo..."
                  className="min-h-[105px] w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                  disabled={isProcessing}
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 select-none">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gợi ý chủ đề thịnh hành
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTopicPrompt(preset.query)}
                      disabled={isProcessing}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50",
                        topicPrompt === preset.query
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border/80 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Configurations */}
              <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:grid-cols-3 select-none">
                {/* Word Count */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Số lượng từ cần tạo
                  </Label>
                  <div className="grid grid-cols-4 gap-1">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setWordCount(num)}
                        className={cn(
                          "rounded-md py-1 text-xs font-semibold transition-colors cursor-pointer",
                          wordCount === num
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-background border border-border/80 text-foreground hover:bg-muted"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CEFR Level */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Cấp độ (CEFR)
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: "A1-A2", label: "A1-A2" },
                      { id: "B1-B2", label: "B1-B2" },
                      { id: "C1-C2", label: "C1-C2" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setCefrLevel(lvl.id)}
                        className={cn(
                          "rounded-md py-1 text-xs font-semibold transition-colors cursor-pointer",
                          cefrLevel === lvl.id
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-background border border-border/80 text-foreground hover:bg-muted"
                        )}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context Tone */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Định hướng sử dụng
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: "general", label: "Giao tiếp" },
                      { id: "academic", label: "Học thuật" },
                      { id: "business", label: "Công sở" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={cn(
                          "rounded-md py-1 text-xs font-semibold transition-colors cursor-pointer",
                          tone === t.id
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-background border border-border/80 text-foreground hover:bg-muted"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Trích xuất đoạn văn */}
            <TabsContent
              value="passage"
              className="flex flex-1 flex-col gap-4 focus-visible:outline-none"
            >
              <div className="space-y-1.5 select-none">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Dán đoạn văn tiếng Anh (bài báo, email, bài đọc IELTS...)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPassageText(PASSAGE_SAMPLE)}
                    className="text-xs text-primary hover:underline cursor-pointer font-medium"
                  >
                    Dán mẫu thử nghiệm
                  </button>
                </div>
                <textarea
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  placeholder="Dán đoạn văn tiếng Anh tại đây. AI sẽ quét và tự động trích lọc các từ/cụm từ quan trọng nhất..."
                  className="min-h-[140px] w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 select-none">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span>AI sẽ trích xuất từ vựng và lấy câu trong bài làm ví dụ ngữ cảnh thực tế.</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">Số từ trích xuất:</span>
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWordCount(num)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
                        wordCount === num
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-background border border-border/80 text-foreground hover:bg-muted"
                      )}
                    >
                      {num} từ
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Hoàn thiện danh sách từ */}
            <TabsContent
              value="words"
              className="flex flex-1 flex-col gap-4 focus-visible:outline-none"
            >
              <div className="space-y-1.5 select-none">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Danh sách từ tiếng Anh (mỗi dòng một từ hoặc cách nhau bởi dấu phẩy)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCustomWordsText(WORD_LIST_SAMPLE)}
                    className="text-xs text-primary hover:underline cursor-pointer font-medium"
                  >
                    Dán danh sách mẫu
                  </button>
                </div>
                <textarea
                  value={customWordsText}
                  onChange={(e) => setCustomWordsText(e.target.value)}
                  placeholder="Ví dụ: resilient, elaborate, meticulous, pragmatic, ubiquitous..."
                  className="min-h-[140px] w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none font-mono text-xs"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground select-none">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Bạn chỉ cần liệt kê các từ tiếng Anh. AI sẽ tự động bổ sung trọn gói: Phiên âm IPA, nghĩa tiếng Việt súc tích, từ loại, ví dụ mẫu và từ đồng nghĩa.
                </span>
              </div>
            </TabsContent>
          </Tabs>

          {/* Modal Action Buttons */}
          <div className="mt-4 flex shrink-0 items-center justify-end gap-2.5 border-t border-border/80 pt-3.5 select-none">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetAndClose}
              disabled={isProcessing}
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="gap-1.5 font-semibold shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {activeTab === "topic"
                  ? "Tạo danh sách từ vựng"
                  : activeTab === "passage"
                  ? "Trích xuất từ bài đọc"
                  : "Hoàn thiện danh sách từ"}
              </span>
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
          className="flex h-[94vh] flex-col rounded-t-2xl border-border/80 bg-background p-4"
        >
          <SheetHeader className="mb-2 shrink-0 border-b border-border/80 pb-3">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Tạo từ vựng thông minh</span>
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
      <DialogContent className="flex h-[88vh] w-[95vw] max-w-[96vw] sm:max-w-3xl lg:max-w-4xl flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-background p-6 shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-border/80 pb-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                AI Tạo từ vựng thông minh
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tự động tạo từ vựng theo chủ đề, trích xuất từ văn bản tiếng Anh hoặc điền chuẩn nghĩa tiếng Việt & phiên âm.
              </p>
            </div>
          </div>
        </DialogHeader>
        {mainContent}
      </DialogContent>
    </Dialog>
  );
}
