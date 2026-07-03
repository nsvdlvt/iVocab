"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileInput } from "lucide-react";
import { QuickImportTextarea } from "./QuickImportTextarea";
import { QuickImportPreview } from "./QuickImportPreview";
import { QuickImportOptions } from "./QuickImportOptions";
import { QuickImportHelp } from "./QuickImportHelp";
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

export function QuickImportDialog({ onImport, isPending }: QuickImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isPendingParse, startTransition] = useTransition();

  const [options, setOptions] = useState<ParseOptions>({
    termDelimiter: "tab",
    customTermDelimiter: "",
    cardDelimiter: "newline",
    customCardDelimiter: "",
  });

  const parsedItems = useMemo(() => {
    return parseQuickImportText(text, options);
  }, [text, options]);

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
    startTransition(() => {
      setText(val);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl h-8.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
            disabled={isPending}
          >
            <FileInput className="h-3.5 w-3.5 opacity-80" />
            Nhập nhanh
          </Button>
        }
      />

      {/* Styled DialogContent for full-height responsive styling */}
      <DialogContent className="max-w-[96vw] lg:max-w-[min(1600px,96vw)] w-full h-[95vh] lg:h-[min(900px,94vh)] flex flex-col p-4 sm:p-6 rounded-2xl shadow-xl gap-4 border border-[#E5E7EB] dark:border-border/60 overflow-hidden">
        <DialogHeader className="shrink-0 select-none border-b border-border/30 pb-3">
          <DialogTitle className="text-base font-bold text-foreground">
            Nhập từ vựng nhanh
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Dán dữ liệu từ Word, Excel, Google Docs hoặc Quizlet để tự động tách thẻ hàng loạt.
          </p>
        </DialogHeader>

        {/* Responsive layout: Grid shifts from 1 col on mobile, 2 cols (50/50) on tablet, 2 cols (45/55) on desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[45%_55%] gap-6 pr-1">
          
          {/* LEFT COLUMN: Textarea, Options, and Guidelines */}
          <div className="flex flex-col gap-4 md:overflow-y-auto md:pr-2 shrink-0 md:shrink">
            <QuickImportTextarea
              text={text}
              onChangeText={handleTextChange}
              isPending={isPending || isPendingParse}
            />

            <QuickImportOptions
              options={options}
              onChangeOptions={setOptions}
              isPending={isPending || isPendingParse}
            />

            <QuickImportHelp />
          </div>

          {/* RIGHT COLUMN: Live Preview area. Mobile behaves natively, Desktop gets fixed content layout */}
          <div className="flex flex-col shrink-0 md:shrink md:overflow-hidden h-[380px] md:h-full">
            <QuickImportPreview
              items={parsedItems}
              validCount={validCount}
              invalidCount={invalidCount}
            />
          </div>

        </div>

        {/* Modal Footer Panel (Fixed at the bottom) */}
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
