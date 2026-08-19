"use client";

import { Eye, EyeOff, Highlighter, MoreHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface ReadingToolbarProps {
  hideMeaning: boolean;
  highlightEnabled: boolean;
  highlightColor: HighlightColor;
  readingFontSize: number;
  canZoomOut: boolean;
  canZoomIn: boolean;
  onToggleHideMeaning: () => void;
  onToggleHighlight: () => void;
  onChangeHighlightColor: (color: HighlightColor) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onOpenNotes?: () => void;
  onOpenVocabulary?: () => void;
  onOpenSettings?: () => void;
}

const highlightColors: Array<{ value: HighlightColor; className: string }> = [
  { value: "yellow", className: "bg-amber-200" },
  { value: "green", className: "bg-emerald-200" },
  { value: "blue", className: "bg-sky-200" },
  { value: "pink", className: "bg-pink-200" },
  { value: "purple", className: "bg-violet-200" },
];

export function ReadingToolbar({
  hideMeaning,
  highlightEnabled,
  highlightColor,
  readingFontSize,
  canZoomOut,
  canZoomIn,
  onToggleHideMeaning,
  onToggleHighlight,
  onChangeHighlightColor,
  onZoomOut,
  onZoomIn,
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

          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
            <button
              type="button"
              onClick={onToggleHighlight}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                highlightEnabled ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
              )}
            >
              <Highlighter className="h-4 w-4" />
              Highlight
            </button>
            {highlightEnabled ? (
              <div className="flex items-center gap-1 pl-1">
                {highlightColors.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeHighlightColor(item.value)}
                    aria-label={`Chọn màu ${item.value}`}
                    aria-pressed={highlightColor === item.value}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-all",
                      item.className,
                      highlightColor === item.value ? "border-slate-950 ring-2 ring-slate-950/15" : "border-border/70"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1 py-1">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={!canZoomOut}
              title="Thu nhỏ chữ"
              aria-label="Thu nhỏ chữ"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full transition-colors",
                canZoomOut ? "hover:bg-muted" : "cursor-not-allowed opacity-40"
              )}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              type="button"
              onClick={onZoomIn}
              disabled={!canZoomIn}
              title="Phóng to chữ"
              aria-label="Phóng to chữ"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full transition-colors",
                canZoomIn ? "hover:bg-muted" : "cursor-not-allowed opacity-40"
              )}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-8 items-center justify-center rounded-full border border-transparent bg-background text-foreground transition-colors hover:bg-muted"
            aria-label="Mở menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onOpenVocabulary?.()}>Từ vựng</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenNotes?.()}>Ghi chú</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenSettings?.()}>Cài đặt</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
