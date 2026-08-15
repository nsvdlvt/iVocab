"use client";

import { BookOpenText, Eye, EyeOff, Highlighter, NotebookPen, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ReadingMode = "bilingual" | "english-only" | "vietnamese-only" | "translation-on-demand";

export interface ReadingToolbarProps {
  hideMeaning: boolean;
  highlightEnabled: boolean;
  readingMode: ReadingMode;
  onToggleHideMeaning: () => void;
  onToggleHighlight: () => void;
  onChangeReadingMode: (mode: ReadingMode) => void;
  onOpenNotes: () => void;
  onOpenVocabulary: () => void;
  onOpenSettings: () => void;
}

const modeLabel: Record<ReadingMode, string> = {
  bilingual: "Song ngữ",
  "english-only": "Chỉ tiếng Anh",
  "vietnamese-only": "Chỉ tiếng Việt",
  "translation-on-demand": "Dịch khi cần",
};

export function ReadingToolbar({
  hideMeaning,
  highlightEnabled,
  readingMode,
  onToggleHideMeaning,
  onToggleHighlight,
  onChangeReadingMode,
  onOpenNotes,
  onOpenVocabulary,
  onOpenSettings,
}: ReadingToolbarProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleHideMeaning}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
              hideMeaning ? "border-foreground/15 bg-foreground text-background" : "border-border bg-background hover:bg-muted"
            )}
          >
            {hideMeaning ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Ẩn/Hiện nghĩa
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full px-3">
                <BookOpenText className="h-4 w-4" />
                {modeLabel[readingMode]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem onSelect={() => onChangeReadingMode("bilingual")}>Song ngữ</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChangeReadingMode("english-only")}>Chỉ tiếng Anh</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChangeReadingMode("vietnamese-only")}>Chỉ tiếng Việt</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChangeReadingMode("translation-on-demand")}>Dịch khi cần</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={highlightEnabled ? "default" : "outline"} className="rounded-full px-3">
                <Highlighter className="h-4 w-4" />
                Highlight
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onSelect={onToggleHighlight}>Bật/Tắt highlight</DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleHighlight}>Chọn màu khi bôi đen</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onOpenVocabulary} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <BookOpenText className="h-4 w-4" />
            Từ vựng
          </button>
          <button type="button" onClick={onOpenNotes} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <NotebookPen className="h-4 w-4" />
            Ghi chú
          </button>
          <button type="button" onClick={onOpenSettings} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Settings2 className="h-4 w-4" />
            Cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
