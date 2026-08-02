"use client";

import React, { useDeferredValue, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileInput } from "lucide-react";
import { QuickImportTextarea } from "./QuickImportTextarea";
import { QuickImportPreview } from "./QuickImportPreview";
import { QuickImportOptions } from "./QuickImportOptions";
import { QuickImportHelp } from "./QuickImportHelp";
import { parseQuickImportText, ParseOptions } from "./QuickImportParser";
import { toast } from "sonner";

const VOCABULARY_TABLE_GENERATOR_URL =
  "https://chatgpt.com/g/g-69da4bb466048191b6955d29d8cb1518-vocabulary-table-generator";

function ChatGPTMarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.5a4.5 4.5 0 0 1 3.95 2.35 4.5 4.5 0 0 1 5.13 5.13A4.5 4.5 0 0 1 24 12a4.5 4.5 0 0 1-2.92 4.02 4.5 4.5 0 0 1-5.13 5.13A4.5 4.5 0 0 1 12 23.5a4.5 4.5 0 0 1-3.95-2.35 4.5 4.5 0 0 1-5.13-5.13A4.5 4.5 0 0 1 0 12a4.5 4.5 0 0 1 2.92-4.02A4.5 4.5 0 0 1 8.05 2.85 4.5 4.5 0 0 1 12 2.5Z"
        className="fill-current opacity-90"
      />
      <path
        d="m8.9 6.2 2.1 1.2a2.8 2.8 0 0 1 4.1 2.42v2.4l-2.1-1.2V9.84a.7.7 0 0 0-1.04-.61l-2.1 1.2a.7.7 0 0 0-.35.61v2.42l-2.1 1.2v-3.62a2.8 2.8 0 0 1 1.49-2.47l2.1-1.2Z"
        className="fill-background"
      />
      <path
        d="M15.1 17.8 13 16.6a2.8 2.8 0 0 1-4.1-2.42v-2.4l2.1 1.2v1.56a.7.7 0 0 0 1.04.61l2.1-1.2a.7.7 0 0 0 .35-.61V10.9l2.1-1.2v3.62a2.8 2.8 0 0 1-1.49 2.47l-2.1 1.2Z"
        className="fill-background"
      />
    </svg>
  );
}

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

export function QuickImportDialog({ onImport, isPending }: QuickImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const deferredText = useDeferredValue(text);

  const [options, setOptions] = useState<ParseOptions>({
    termDelimiter: "tab",
    customTermDelimiter: "",
    cardDelimiter: "newline",
    customCardDelimiter: "",
  });

  const parsedItems = useMemo(() => parseQuickImportText(deferredText, options), [deferredText, options]);

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
    toast.success(`Đã thêm ${validCount} từ vựng vào danh sách thẻ chỉnh sửa.`);
  };

  const handleTextChange = (val: string) => {
    setText(val);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl h-9 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer min-h-[44px] md:min-h-0"
            disabled={isPending}
          >
            <FileInput className="h-3.5 w-3.5 opacity-80" />
            Nhập nhanh
          </Button>
        }
      />

      <DialogContent className="max-w-[96vw] lg:max-w-[min(1600px,96vw)] w-full h-[95vh] lg:h-[min(900px,94vh)] flex flex-col p-4 sm:p-6 rounded-2xl shadow-xl gap-4 border border-[#E5E7EB] dark:border-border/60 overflow-hidden">
        <DialogHeader className="shrink-0 select-none border-b border-border/30 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground">
                Nhập từ vựng nhanh
              </DialogTitle>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Dán dữ liệu từ Word, Excel, Google Docs hoặc Quizlet để tự động tách thẻ hàng loạt.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(VOCABULARY_TABLE_GENERATOR_URL, "_blank", "noopener,noreferrer")
              }
              className="shrink-0 h-9 rounded-full border-border/70 bg-background/80 px-3 text-xs font-semibold shadow-sm hover:bg-muted/60"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <ChatGPTMarkIcon />
                </span>
                <span className="hidden sm:inline">Tạo bằng AI</span>
                <span className="sm:hidden">AI</span>
              </span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[45%_55%] gap-6 pr-1">
          <div className="flex flex-col gap-4 md:overflow-y-auto md:pr-2 shrink-0 md:shrink">
            <QuickImportTextarea
              text={text}
              onChangeText={handleTextChange}
              isPending={isPending}
            />

            <QuickImportOptions
              options={options}
              onChangeOptions={setOptions}
              isPending={isPending}
            />

            <QuickImportHelp />
          </div>

          <div className="flex flex-col shrink-0 md:shrink md:overflow-hidden h-[380px] md:h-full">
            <QuickImportPreview
              items={parsedItems}
              validCount={validCount}
              invalidCount={invalidCount}
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between pt-3 border-t border-border/30 select-none">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearAll}
            disabled={isPending || text.length === 0}
            className="rounded-xl h-9 text-xs font-semibold px-4 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer"
          >
            Xóa tất cả
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="rounded-xl h-9 text-xs font-semibold px-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleAddCards}
              disabled={isPending || validCount === 0}
              className="rounded-xl h-9 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              Thêm vào danh sách ({validCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
