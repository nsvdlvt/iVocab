"use client";

import {
  Highlighter,
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  Languages,
  BookOpen,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReadingMode } from "./reading-types";

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface ReadingToolbarProps {
  hideMeaning: boolean;
  highlightEnabled: boolean;
  highlightColor: HighlightColor;
  readingFontSize: number;
  canZoomOut: boolean;
  canZoomIn: boolean;
  mode?: ReadingMode;
  isPlayingAudio?: boolean;
  questionsCount?: number;
  onToggleHideMeaning: () => void;
  onToggleHighlight: () => void;
  onChangeHighlightColor: (color: HighlightColor) => void;
  onChangeMode?: (mode: ReadingMode) => void;
  onToggleAudio?: () => void;
  onJumpToQuestions?: () => void;
  onResetHighlights?: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onOpenNotes?: () => void;
  onOpenVocabulary?: () => void;
  onOpenSettings?: () => void;
}

const highlightColors: Array<{ value: HighlightColor; label: string; className: string }> = [
  { value: "yellow", label: "Vàng", className: "bg-amber-200" },
  { value: "green", label: "Xanh lá", className: "bg-emerald-200" },
  { value: "blue", label: "Xanh dương", className: "bg-sky-200" },
  { value: "pink", label: "Hồng", className: "bg-pink-200" },
  { value: "purple", label: "Tím", className: "bg-violet-200" },
];

export function ReadingToolbar({
  hideMeaning,
  highlightEnabled,
  highlightColor,
  readingFontSize,
  canZoomOut,
  canZoomIn,
  mode = hideMeaning ? "english" : "bilingual",
  isPlayingAudio = false,
  questionsCount = 0,
  onToggleHideMeaning,
  onToggleHighlight,
  onChangeHighlightColor,
  onChangeMode,
  onToggleAudio,
  onJumpToQuestions,
  onResetHighlights,
  onZoomOut,
  onZoomIn,
  onOpenNotes,
  onOpenVocabulary,
  onOpenSettings,
}: ReadingToolbarProps) {
  const currentMode: ReadingMode = mode;

  const handleSelectMode = (newMode: ReadingMode) => {
    if (onChangeMode) {
      onChangeMode(newMode);
    } else {
      if (newMode === "english" && !hideMeaning) {
        onToggleHideMeaning();
      } else if (newMode === "bilingual" && hideMeaning) {
        onToggleHideMeaning();
      }
    }
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher Segmented Control */}
          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectMode("bilingual")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-all flex items-center gap-1.5",
                currentMode === "bilingual"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Languages className="h-3.5 w-3.5" />
              Song ngữ
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode("english")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-all flex items-center gap-1.5",
                currentMode === "english"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode("vietnamese")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-all flex items-center gap-1.5",
                currentMode === "vietnamese"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tiếng Việt
            </button>
          </div>

          {/* Highlight Button and Color Palette */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1">
            <button
              type="button"
              onClick={onToggleHighlight}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                highlightEnabled
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlight
            </button>
            {highlightEnabled ? (
              <div className="flex items-center gap-1 pl-1">
                {highlightColors.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeHighlightColor(item.value)}
                    aria-label={`Chọn màu ${item.label}`}
                    aria-pressed={highlightColor === item.value}
                    className={cn(
                      "h-5 w-5 rounded-full border transition-all",
                      item.className,
                      highlightColor === item.value
                        ? "border-foreground ring-2 ring-primary/40 scale-110"
                        : "border-border/70 hover:scale-105"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Text Zoom Controls */}
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-background px-1.5 py-1">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={!canZoomOut}
              title="Thu nhỏ chữ"
              aria-label="Thu nhỏ chữ"
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                canZoomOut ? "hover:bg-muted text-foreground" : "cursor-not-allowed opacity-40 text-muted-foreground"
              )}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 text-xs font-mono font-semibold text-muted-foreground tabular-nums">
              {readingFontSize}px
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={!canZoomIn}
              title="Phóng to chữ"
              aria-label="Phóng to chữ"
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                canZoomIn ? "hover:bg-muted text-foreground" : "cursor-not-allowed opacity-40 text-muted-foreground"
              )}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Audio TTS Read-All Toggle */}
          {onToggleAudio ? (
            <button
              type="button"
              onClick={onToggleAudio}
              title={isPlayingAudio ? "Dừng đọc" : "Đọc bài bằng giọng đọc AI"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                isPlayingAudio
                  ? "border-primary bg-primary text-primary-foreground animate-pulse"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {isPlayingAudio ? "Dừng đọc" : "Nghe đọc"}
            </button>
          ) : null}

          {/* Jump to Comprehension Quiz */}
          {onJumpToQuestions ? (
            <button
              type="button"
              onClick={onJumpToQuestions}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Câu hỏi đọc hiểu
              {questionsCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">
                  {questionsCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>

        {/* Dropdown Options */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
            aria-label="Mở menu tùy chọn"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl">
            {onOpenVocabulary ? (
              <DropdownMenuItem onSelect={() => onOpenVocabulary()} className="gap-2 cursor-pointer">
                <BookOpen className="h-4 w-4 text-primary" />
                Từ vựng trong bài
              </DropdownMenuItem>
            ) : null}
            {onResetHighlights ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onResetHighlights()} className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                  Xóa toàn bộ highlight
                </DropdownMenuItem>
              </>
            ) : null}
            {onOpenNotes ? (
              <DropdownMenuItem onSelect={() => onOpenNotes()} className="gap-2 cursor-pointer">
                Ghi chú bài đọc
              </DropdownMenuItem>
            ) : null}
            {onOpenSettings ? (
              <DropdownMenuItem onSelect={() => onOpenSettings()} className="gap-2 cursor-pointer">
                Cài đặt hiển thị
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
