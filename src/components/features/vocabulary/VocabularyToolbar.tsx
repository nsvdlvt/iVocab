"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { QuickImportDialog } from "./QuickImportDialog";
import { AIImportDialog } from "./AIImportDialog";

interface ImportedCard {
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
  synonyms?: string;
}

interface VocabularyToolbarProps {
  visibility: "private" | "public" | "unlisted";
  onChangeVisibility: (val: "private" | "public" | "unlisted") => void;
  isPending: boolean;
  onCreateClick: () => void;
  onImportCards: (newCards: ImportedCard[]) => void;
  existingWords: Array<{ word: string; meaning: string }>;
}

export function VocabularyToolbar({
  visibility,
  onChangeVisibility,
  isPending,
  onCreateClick,
  onImportCards,
  existingWords,
}: VocabularyToolbarProps) {
  const toggleVisibility = () => {
    onChangeVisibility(visibility === "private" ? "public" : "private");
  };

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between py-5 border-b border-border/40 bg-background/30 backdrop-blur-md px-2 md:px-1 select-none gap-4">
      {/* Title & Navigation */}
      <div className="flex items-start gap-3 min-w-0">
        <Link href="/vocabulary" className="p-2 hover:bg-muted rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">Tạo bộ thẻ mới</h1>
          <p className="text-[11px] text-muted-foreground font-medium hidden sm:block mt-0.5">
            Không sử dụng màu và biểu tượng, chỉ tập trung vào từ vựng học tập của bạn.
          </p>
        </div>
      </div>

      {/* Actions Container - Cards layout on Mobile, transparent row on Desktop */}
      <div className="w-full md:w-auto p-4 md:p-0 bg-muted/40 md:bg-transparent border border-border/60 md:border-0 rounded-2xl md:rounded-none flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick import dialogue integration */}
          <QuickImportDialog onImport={onImportCards} isPending={isPending} />

          {/* AI import integration */}
          <AIImportDialog
            onImport={onImportCards}
            existingWords={existingWords}
            isPending={isPending}
          />

          <div className="hidden md:block h-4 w-px bg-border/40 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            disabled={isPending}
            className="rounded-xl h-9 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all min-h-[44px] md:min-h-0"
          >
            {visibility === "private" ? "🔒 Riêng tư" : "🌐 Công khai"}
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onCreateClick}
          disabled={isPending}
          className="rounded-xl h-9 text-xs font-bold px-5 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-xs active:translate-y-px transition-all duration-150 w-full sm:w-auto min-h-[44px] md:min-h-0"
        >
          {isPending ? "Đang lưu..." : "Lưu bộ thẻ"}
        </Button>
      </div>
    </div>
  );
}

