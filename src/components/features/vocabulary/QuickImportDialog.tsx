"use client";

import React, { useDeferredValue, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileInput, Sparkles } from "lucide-react";
import { QuickImportTextarea } from "./QuickImportTextarea";
import { QuickImportPreview } from "./QuickImportPreview";
import { QuickImportOptions } from "./QuickImportOptions";
import { QuickImportHelp } from "./QuickImportHelp";
import { QuickImportPromptDialog } from "./QuickImportPromptDialog";
import { parseQuickImportText, ParseOptions } from "./QuickImportParser";
import { toast } from "sonner";

interface ImportedCard {
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
  synonyms?: string;
}

interface QuickImportDialogProps {
  onImport: (newCards: ImportedCard[]) => void;
  isPending: boolean;
}

export function QuickImportDialog({
  onImport,
  isPending,
}: QuickImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [text, setText] = useState("");
  const deferredText = useDeferredValue(text);

  const [options, setOptions] = useState<ParseOptions>({
    termDelimiter: "tab",
    customTermDelimiter: "",
    cardDelimiter: "newline",
    customCardDelimiter: "",
  });

  const parsedItems = useMemo(
    () => parseQuickImportText(deferredText, options),
    [deferredText, options]
  );

  const { validItems, validCount, invalidCount } = useMemo(() => {
    const valid = parsedItems.filter((i) => i.isValid);
    return {
      validItems: valid,
      validCount: valid.length,
      invalidCount: parsedItems.length - valid.length,
    };
  }, [parsedItems]);

  const handleClearAll = () => {
    setText("");
    toast.success("Đã xóa trắng khung nhập liệu.");
  };

  const handleAddCards = () => {
    if (validCount === 0) {
      toast.error("Không tìm thấy dòng từ vựng hợp lệ nào để nhập.");
      return;
    }

    const newCards = validItems.map((item) => ({
      word: item.word,
      meaning: item.meaning,
      ipa: item.ipa || undefined,
      partOfSpeech: item.partOfSpeech || undefined,
      example: item.example || undefined,
      synonyms: item.synonyms || undefined,
    }));

    onImport(newCards);
    setIsOpen(false);
    setText("");
    toast.success(`Đã thêm ${validCount} từ vựng vào bộ từ.`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg px-3 text-xs font-medium"
            disabled={isPending}
          >
            <FileInput className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Nhập nhanh</span>
          </Button>
        }
      />

      <DialogContent className="flex h-[92vh] w-full max-w-[96vw] flex-col gap-4 overflow-hidden rounded-xl border border-border/80 p-4 sm:p-6 lg:h-[min(860px,92vh)] lg:max-w-[min(1440px,95vw)]">
        <DialogHeader className="shrink-0 border-b border-border/80 pb-3.5 select-none">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                Nhập từ vựng hàng loạt
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dán bảng từ vựng từ Excel, Google Sheets, Quizlet hoặc bảng Markdown từ ChatGPT.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPromptOpen(true)}
              className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Tạo tự động bằng AI</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto pr-1 md:grid-cols-2 md:overflow-hidden lg:grid-cols-[44%_56%]">
          <div className="flex shrink-0 flex-col gap-3.5 md:shrink md:overflow-y-auto md:pr-1">
            <QuickImportTextarea
              text={text}
              onChangeText={setText}
              isPending={isPending}
            />

            <QuickImportOptions
              options={options}
              onChangeOptions={setOptions}
              isPending={isPending}
            />

            <QuickImportHelp />
          </div>

          <div className="flex h-[360px] shrink-0 flex-col md:h-full md:shrink md:overflow-hidden">
            <QuickImportPreview
              items={parsedItems}
              validCount={validCount}
              invalidCount={invalidCount}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border/80 pt-3.5 select-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={isPending || text.length === 0}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Xóa tất cả
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCards}
              disabled={isPending || validCount === 0}
              className="font-semibold"
            >
              Thêm vào danh sách ({validCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <QuickImportPromptDialog
      open={isPromptOpen}
      onOpenChange={setIsPromptOpen}
    />
  </>
);
}
