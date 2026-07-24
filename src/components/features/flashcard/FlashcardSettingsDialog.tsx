"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type FlashcardFrontMode = "term" | "definition";
export type FlashcardFilterMode = "all" | "unlearned" | "starred";

export interface FlashcardSettingsState {
  autoSpeak: boolean;
  frontMode: FlashcardFrontMode;
  filterMode: FlashcardFilterMode;
}

interface FlashcardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: FlashcardSettingsState;
  onSave: (settings: FlashcardSettingsState) => void;
  showFilterOptions?: boolean;
}

const FRONT_MODE_OPTIONS: Array<{
  value: FlashcardFrontMode;
  title: string;
  description: string;
}> = [
  {
    value: "term",
    title: "Mặt trước hiện thuật ngữ",
    description: "Hiển thị từ vựng, IPA và từ loại ở mặt trước.",
  },
  {
    value: "definition",
    title: "Mặt trước hiện định nghĩa",
    description: "Hiển thị nghĩa tiếng Việt ở mặt trước để tự nhớ lại thuật ngữ.",
  },
];

const FILTER_MODE_OPTIONS: Array<{
  value: FlashcardFilterMode;
  title: string;
  description: string;
}> = [
  {
    value: "all",
    title: "Tất cả từ",
    description: "Hiển thị toàn bộ từ vựng trong bộ thẻ.",
  },
  {
    value: "unlearned",
    title: "Chỉ từ chưa thuộc",
    description: "Ẩn các từ đã đạt mức thành thạo trong SRS.",
  },
  {
    value: "starred",
    title: "Chỉ từ đánh dấu sao",
    description: "Chỉ học các từ đã được gắn sao.",
  },
];

export function FlashcardSettingsDialog({ open, onOpenChange, settings, onSave, showFilterOptions = true }: FlashcardSettingsDialogProps) {
  const [local, setLocal] = React.useState<FlashcardSettingsState>(settings);

  React.useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setLocal(settings), 0);
    return () => window.clearTimeout(handle);
  }, [open, settings]);

  const handleSave = () => {
    onSave(local);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border bg-card p-5 shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-extrabold text-foreground">Cài đặt Flashcard</DialogTitle>
          </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Chế độ hiển thị</p>
              <p className="text-xs text-muted-foreground">Chọn nội dung hiển thị ở mặt trước thẻ.</p>
            </div>

            <div className="space-y-2">
              {FRONT_MODE_OPTIONS.map((option) => {
                const active = local.frontMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...prev, frontMode: option.value }))}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 bg-muted/20 hover:bg-muted/35",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold text-foreground">{option.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {showFilterOptions ? (
            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Lọc từ vựng</p>
                <p className="text-xs text-muted-foreground">Chọn nhóm từ muốn học trong bộ flashcard.</p>
              </div>

              <div className="space-y-2">
                {FILTER_MODE_OPTIONS.map((option) => {
                  const active = local.filterMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLocal((prev) => ({ ...prev, filterMode: option.value }))}
                      className={[
                        "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                        active ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 bg-muted/20 hover:bg-muted/35",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-foreground">{option.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 rounded-xl text-xs font-medium">
            Hủy
          </Button>
          <Button onClick={handleSave} className="h-10 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-500">
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
