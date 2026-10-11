"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
    title: "Mặt trước hiện thuật ngữ (Tiếng Anh)",
    description: "Hiển thị từ vựng, IPA và từ loại ở mặt trước.",
  },
  {
    value: "definition",
    title: "Mặt trước hiện định nghĩa (Tiếng Việt)",
    description: "Hiển thị nghĩa tiếng Việt ở mặt trước để tự nhớ lại từ gốc.",
  },
];

const FILTER_MODE_OPTIONS: Array<{
  value: FlashcardFilterMode;
  title: string;
  description: string;
}> = [
  {
    value: "all",
    title: "Tất cả từ vựng",
    description: "Hiển thị toàn bộ từ vựng trong bộ thẻ.",
  },
  {
    value: "unlearned",
    title: "Chỉ từ chưa thành thạo",
    description: "Ẩn các từ đã đạt cấp độ tối đa (Level 5) trong SRS.",
  },
  {
    value: "starred",
    title: "Chỉ từ đánh dấu sao",
    description: "Chỉ luyện tập các từ vựng bạn đã gắn sao.",
  },
];

export function FlashcardSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  showFilterOptions = true,
}: FlashcardSettingsDialogProps) {
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
      <DialogContent className="max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-foreground">
            Tùy chỉnh thẻ ghi nhớ
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thiết lập mặt hiển thị và bộ lọc thẻ từ trong phiên học.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mặt trước thẻ
            </p>
            <div className="space-y-2">
              {FRONT_MODE_OPTIONS.map((option) => {
                const active = local.frontMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setLocal((prev) => ({ ...prev, frontMode: option.value }))
                    }
                    className={cn(
                      "w-full flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all cursor-pointer",
                      active
                        ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
                        : "border-border/80 bg-muted/15 hover:bg-muted/35"
                    )}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {option.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    {active && (
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {showFilterOptions ? (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lọc danh sách thẻ
              </p>
              <div className="space-y-2">
                {FILTER_MODE_OPTIONS.map((option) => {
                  const active = local.filterMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setLocal((prev) => ({ ...prev, filterMode: option.value }))
                      }
                      className={cn(
                        "w-full flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all cursor-pointer",
                        active
                          ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
                          : "border-border/80 bg-muted/15 hover:bg-muted/35"
                      )}
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">
                          {option.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {active && (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSave}>
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
