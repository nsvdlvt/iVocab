"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Volume2, VolumeX, Sparkles, Loader2, RotateCcw, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BilingualParagraph, ReadingHighlight, ReadingMode, HighlightedWord } from "./reading-types";

const highlightClassMap: Record<ReadingHighlight["color"], string> = {
  yellow: "bg-amber-200/90 text-slate-900 dark:bg-amber-500/35 dark:text-amber-100",
  green: "bg-emerald-200/90 text-slate-900 dark:bg-emerald-500/35 dark:text-emerald-100",
  blue: "bg-sky-200/90 text-slate-900 dark:bg-sky-500/35 dark:text-sky-100",
  pink: "bg-pink-200/90 text-slate-900 dark:bg-pink-500/35 dark:text-pink-100",
  purple: "bg-violet-200/90 text-slate-900 dark:bg-violet-500/35 dark:text-violet-100",
};

interface TextSpan {
  start: number;
  end: number;
  highlight?: ReadingHighlight;
  vocabWord?: HighlightedWord;
}

function extractSelection(container: HTMLElement | null): string | null {
  if (typeof window === "undefined") return null;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!container) return null;
  const isInside =
    container === range.commonAncestorContainer ||
    container.contains(range.commonAncestorContainer) ||
    container.contains(range.startContainer) ||
    container.contains(range.endContainer);
  if (!isInside) return null;
  const selectedText = selection.toString().trim();
  return selectedText || null;
}

function renderContentWithHighlightsAndVocab(
  text: string,
  highlights: ReadingHighlight[] | undefined,
  paragraphId: string,
  language: "en" | "vi",
  vocabWords?: HighlightedWord[],
  onHighlightClick?: (highlight: ReadingHighlight, e: React.MouseEvent) => void,
  onVocabClick?: (word: HighlightedWord) => void
): React.ReactNode {
  if (!text) return null;

  const activeHighlights = (highlights ?? []).filter(
    (item) => item.paragraphId === paragraphId && item.language === language
  );

  const spans: TextSpan[] = [];
  const lowerText = text.toLowerCase();

  // Find occurrences of user highlights
  for (const h of activeHighlights) {
    const target = h.selectedText.trim().toLowerCase();
    if (!target) continue;

    let searchIndex = 0;
    while (searchIndex < lowerText.length) {
      const found = lowerText.indexOf(target, searchIndex);
      if (found < 0) break;
      spans.push({
        start: found,
        end: found + target.length,
        highlight: h,
      });
      searchIndex = found + target.length;
    }
  }

  // Find vocabulary words (if language is English)
  if (language === "en" && vocabWords && vocabWords.length > 0) {
    for (const v of vocabWords) {
      const target = v.text.trim().toLowerCase();
      if (!target) continue;

      let searchIndex = 0;
      while (searchIndex < lowerText.length) {
        const found = lowerText.indexOf(target, searchIndex);
        if (found < 0) break;
        spans.push({
          start: found,
          end: found + target.length,
          vocabWord: v,
        });
        searchIndex = found + target.length;
      }
    }
  }

  // Sort spans by start offset, highlights taking priority over vocab
  spans.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.highlight && !b.highlight) return -1;
    if (!a.highlight && b.highlight) return 1;
    return b.end - a.end;
  });

  // Non-overlapping interval resolution
  const resolvedSpans: TextSpan[] = [];
  let lastEnd = 0;
  for (const span of spans) {
    if (span.start >= lastEnd) {
      resolvedSpans.push(span);
      lastEnd = span.end;
    }
  }

  if (resolvedSpans.length === 0) {
    return text;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  resolvedSpans.forEach((span, index) => {
    if (span.start > cursor) {
      nodes.push(
        <span key={`txt-${index}-${cursor}`}>{text.slice(cursor, span.start)}</span>
      );
    }

    const chunk = text.slice(span.start, span.end);

    if (span.highlight) {
      const h = span.highlight;
      nodes.push(
        <mark
          key={`hl-${h.id}-${span.start}`}
          onClick={(e) => {
            e.stopPropagation();
            onHighlightClick?.(h, e);
          }}
          className={cn(
            "rounded-md px-1 py-0.5 transition-colors cursor-pointer ring-offset-background hover:ring-2 hover:ring-primary/40",
            highlightClassMap[h.color]
          )}
          title="Bấm để đổi màu hoặc xóa highlight"
        >
          {chunk}
        </mark>
      );
    } else if (span.vocabWord) {
      const v = span.vocabWord;
      nodes.push(
        <span
          key={`vw-${v.text}-${span.start}`}
          onClick={(e) => {
            e.stopPropagation();
            onVocabClick?.(v);
          }}
          className="border-b-2 border-primary/60 text-foreground cursor-pointer font-medium hover:bg-amber-400/15 hover:border-amber-500 dark:hover:bg-amber-400/20 rounded-sm px-1 py-0.5 transition-all duration-150 inline-block active:scale-95 shadow-2xs"
          title={`Bấm để xem nghĩa từ: ${v.text}`}
        >
          {chunk}
        </span>
      );
    }

    cursor = span.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key={`txt-end-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

export interface ReadingSectionProps {
  paragraph: BilingualParagraph;
  index: number;
  showTranslation: boolean;
  mode?: ReadingMode;
  highlights?: ReadingHighlight[];
  highlightEnabled?: boolean;
  highlightColor?: ReadingHighlight["color"];
  fontSize: number;
  onCreateHighlight?: (payload: {
    paragraphId: string;
    language: "en" | "vi";
    selectedText: string;
    color: ReadingHighlight["color"];
  }) => void;
  onUpdateHighlightColor?: (highlightId: string, color: ReadingHighlight["color"]) => void;
  onDeleteHighlight?: (highlightId: string) => void;
  onVocabClick?: (word: HighlightedWord) => void;
  onTranslateParagraph?: (paragraphId: string, englishText: string) => Promise<void>;
  translationLoading?: boolean;
  translationError?: string | null;
}

export function ReadingSection({
  paragraph,
  index,
  showTranslation,
  mode = showTranslation ? "bilingual" : "english",
  highlights,
  highlightEnabled,
  highlightColor = "yellow",
  fontSize,
  onCreateHighlight,
  onUpdateHighlightColor,
  onDeleteHighlight,
  onVocabClick,
  onTranslateParagraph,
  translationLoading = false,
  translationError = null,
}: ReadingSectionProps) {
  const mobileEnRef = React.useRef<HTMLParagraphElement | null>(null);
  const desktopEnRef = React.useRef<HTMLParagraphElement | null>(null);
  const mobileViRef = React.useRef<HTMLDivElement | null>(null);
  const desktopViRef = React.useRef<HTMLDivElement | null>(null);

  const [activeHighlightPopover, setActiveHighlightPopover] = React.useState<{
    highlight: ReadingHighlight;
    x: number;
    y: number;
  } | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const handleTextSelection = (language: "en" | "vi", container: HTMLElement | null) => {
    if (!highlightEnabled) return;
    const selected = extractSelection(container);
    if (!selected || selected.length < 2) return;

    onCreateHighlight?.({
      paragraphId: paragraph.id,
      language,
      selectedText: selected,
      color: highlightColor,
    });

    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleHighlightClick = (highlight: ReadingHighlight, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveHighlightPopover({
      highlight,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const playParagraphAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(paragraph.source);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const hasTranslation = Boolean(paragraph.translation && paragraph.translation.trim().length > 0);

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!activeHighlightPopover) return;
    const handleOutsideClick = () => setActiveHighlightPopover(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeHighlightPopover]);

  const showEnglish = mode === "bilingual" || mode === "english";
  const showVietnamese = (mode === "bilingual" && showTranslation) || mode === "vietnamese";

  return (
    <div
      id={`paragraph-${paragraph.id}`}
      className={cn("px-5 py-5 md:px-7 md:py-6 transition-colors", index > 0 && "border-t border-border/60")}
    >
      {/* Mobile Stacked View */}
      <div className="grid gap-5 md:hidden">
        {showEnglish && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Đoạn {index + 1}</span>
              <button
                type="button"
                onClick={playParagraphAudio}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary lowercase hover:underline"
              >
                {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {isPlayingAudio ? "dừng" : "nghe"}
              </button>
            </div>
            <p
              ref={mobileEnRef}
              onMouseUp={() => handleTextSelection("en", mobileEnRef.current)}
              className="break-words whitespace-pre-wrap leading-8 text-foreground select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {renderContentWithHighlightsAndVocab(
                paragraph.source,
                highlights,
                paragraph.id,
                "en",
                paragraph.highlightedWords,
                handleHighlightClick,
                onVocabClick
              )}
            </p>
          </div>
        )}

        {showVietnamese && (
          <div
            ref={mobileViRef}
            onMouseUp={() => handleTextSelection("vi", mobileViRef.current)}
            className="overflow-hidden border-l-2 border-primary/40 pl-4 py-1 space-y-1.5"
          >
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <Languages className="h-3.5 w-3.5" />
              Bản dịch tiếng Việt
            </div>

            {hasTranslation ? (
              <p
                className="break-words whitespace-pre-wrap leading-7 text-muted-foreground select-text"
                style={{ fontSize: `${Math.max(12, fontSize - 1)}px` }}
              >
                {renderContentWithHighlightsAndVocab(
                  paragraph.translation ?? "",
                  highlights,
                  paragraph.id,
                  "vi",
                  undefined,
                  handleHighlightClick
                )}
              </p>
            ) : (
              <div className="py-2 space-y-2">
                <p className="text-xs text-muted-foreground italic">
                  Chưa có bản dịch tiếng Việt cho đoạn này.
                </p>
                {onTranslateParagraph && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={translationLoading}
                    onClick={() => onTranslateParagraph(paragraph.id, paragraph.source)}
                    className="rounded-full text-xs h-8 gap-1.5"
                  >
                    {translationLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    )}
                    {translationLoading ? "Đang dịch..." : "Dịch bằng AI"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div
          className={cn(
            "grid gap-x-8 lg:gap-x-10 items-start",
            mode === "bilingual" && showTranslation
              ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
              : "grid-cols-1"
          )}
        >
          {showEnglish && (
            <div className="min-w-0 pr-1">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>Paragraph {index + 1}</span>
                <button
                  type="button"
                  onClick={playParagraphAudio}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary lowercase hover:underline transition-opacity"
                  title="Nghe phát âm đoạn này"
                >
                  {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {isPlayingAudio ? "dừng" : "nghe"}
                </button>
              </div>
              <p
                ref={desktopEnRef}
                onMouseUp={() => handleTextSelection("en", desktopEnRef.current)}
                className="break-words whitespace-pre-wrap leading-8 text-foreground select-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                {renderContentWithHighlightsAndVocab(
                  paragraph.source,
                  highlights,
                  paragraph.id,
                  "en",
                  paragraph.highlightedWords,
                  handleHighlightClick,
                  onVocabClick
                )}
              </p>
            </div>
          )}

          {showVietnamese && (
            <div
              ref={desktopViRef}
              onMouseUp={() => handleTextSelection("vi", desktopViRef.current)}
              className={cn(
                "min-w-0 select-text",
                mode === "bilingual" ? "border-l border-border/70 pl-6 lg:pl-8" : ""
              )}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-primary" />
                Bản dịch #{index + 1}
              </div>

              {hasTranslation ? (
                <p
                  className="break-words whitespace-pre-wrap leading-8 text-muted-foreground"
                  style={{ fontSize: `${Math.max(12, fontSize - 1)}px` }}
                >
                  {renderContentWithHighlightsAndVocab(
                    paragraph.translation ?? "",
                    highlights,
                    paragraph.id,
                    "vi",
                    undefined,
                    handleHighlightClick
                  )}
                </p>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Chưa có bản dịch cho đoạn này.
                  </p>
                  {translationError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      {translationError}
                    </p>
                  )}
                  {onTranslateParagraph && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={translationLoading}
                      onClick={() => onTranslateParagraph(paragraph.id, paragraph.source)}
                      className="rounded-full text-xs h-8 gap-1.5"
                    >
                      {translationLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang dịch bằng AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {translationError ? "Thử lại dịch AI" : "Dịch đoạn này bằng AI"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Highlight Action Floating Popover */}
      {activeHighlightPopover && (
        <div
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-full border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: activeHighlightPopover.x,
            top: activeHighlightPopover.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(["yellow", "green", "blue", "pink", "purple"] as const).map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Đổi sang màu ${color}`}
              onClick={() => {
                onUpdateHighlightColor?.(activeHighlightPopover.highlight.id, color);
                setActiveHighlightPopover(null);
              }}
              className={cn(
                "h-6 w-6 rounded-full border transition-transform hover:scale-110 flex items-center justify-center",
                color === "yellow" && "bg-amber-200 border-amber-300",
                color === "green" && "bg-emerald-200 border-emerald-300",
                color === "blue" && "bg-sky-200 border-sky-300",
                color === "pink" && "bg-pink-200 border-pink-300",
                color === "purple" && "bg-violet-200 border-violet-300",
                activeHighlightPopover.highlight.color === color && "ring-2 ring-primary"
              )}
            >
              {activeHighlightPopover.highlight.color === color ? (
                <Check className="h-3 w-3 text-slate-800" />
              ) : null}
            </button>
          ))}

          <div className="h-4 w-px bg-border mx-0.5" />

          <button
            type="button"
            aria-label="Xóa highlight này"
            onClick={() => {
              onDeleteHighlight?.(activeHighlightPopover.highlight.id);
              setActiveHighlightPopover(null);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/20 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
