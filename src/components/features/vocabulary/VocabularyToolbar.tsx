"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { QuickImportDialog } from "./QuickImportDialog";

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
}

export function VocabularyToolbar({
  visibility,
  onChangeVisibility,
  isPending,
  onCreateClick,
  onImportCards,
}: VocabularyToolbarProps) {
  const toggleVisibility = () => {
    onChangeVisibility(visibility === "private" ? "public" : "private");
  };

  return (
    <div className="w-full flex items-center justify-between py-5 border-b border-border/40 bg-background/30 backdrop-blur-md px-1 select-none">
      <div className="flex items-center gap-3">
        <Link href="/vocabulary" className="p-1.5 hover:bg-muted rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tạo bộ thẻ mới</h1>
          <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
            Không sử dụng màu và biểu tượng, chỉ tập trung vào từ vựng học tập của bạn.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick import dialogue integration */}
        <QuickImportDialog onImport={onImportCards} isPending={isPending} />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl h-8.5 text-xs font-semibold gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer"
          onClick={() => alert("Trợ lý AI đang được phát triển")}
          disabled={isPending}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tạo nhanh
        </Button>

        <div className="h-4 w-px bg-border/40 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleVisibility}
          disabled={isPending}
          className="rounded-xl h-8.5 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          {visibility === "private" ? "🔒 Riêng tư" : "🌐 Công khai"}
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onCreateClick}
          disabled={isPending}
          className="rounded-xl h-8.5 text-xs font-bold px-4 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-xs active:translate-y-px transition-all duration-150"
        >
          {isPending ? "Đang lưu..." : "Lưu bộ thẻ"}
        </Button>
      </div>
    </div>
  );
}
