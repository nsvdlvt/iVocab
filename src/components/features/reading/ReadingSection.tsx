"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BilingualParagraph, ReadingHighlight } from "./reading-types";

const highlightClassMap: Record<ReadingHighlight["color"], string> = {
  yellow: "bg-amber-200/90 text-foreground",
  green: "bg-emerald-200/90 text-foreground",
  blue: "bg-sky-200/90 text-foreground",
  pink: "bg-pink-200/90 text-foreground",
  purple: "bg-violet-200/90 text-foreground",
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function renderHighlightedText(
  text: string,
  highlights: ReadingHighlight[] | undefined,
  paragraphId: string,
  language: "en" | "vi"
) {
  const items = (highlights ?? []).filter((item) => item.paragraphId === paragraphId && item.language === language);
  if (!items.length) return text;

  const selected = items[0];
  const target = normalizeText(selected.selectedText);
  const matchIndex = normalizeText(text).indexOf(target);
  if (matchIndex < 0) return text;

  const lower = text.toLowerCase();
  const exactStart = lower.indexOf(selected.selectedText.trim().toLowerCase());
  const start = exactStart >= 0 ? exactStart : matchIndex;
  const end = start + selected.selectedText.trim().length;

  const chunks: React.ReactNode[] = [];
  if (start > 0) chunks.push(<span key="before">{text.slice(0, start)}</span>);
  chunks.push(
    <mark key="highlight" className={cn("rounded-md px-1 py-0.5 transition-colors", highlightClassMap[selected.color])}>
      {text.slice(start, end)}
    </mark>
  );
  if (end < text.length) chunks.push(<span key="after">{text.slice(end)}</span>);
  return chunks;
}

function extractSelection(container: HTMLElement | null) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!container || !container.contains(range.commonAncestorContainer)) return null;
  const selectedText = selection.toString().trim();
  return selectedText || null;
}

function EnglishParagraph({
  paragraph,
  highlights,
  onCreateHighlight,
  highlightEnabled,
  highlightColor,
  fontSize,
}: {
  paragraph: BilingualParagraph;
  highlights?: ReadingHighlight[];
  onCreateHighlight?: (payload: { paragraphId: string; language: "en" | "vi"; selectedText: string; color: ReadingHighlight["color"] }) => void;
  highlightEnabled?: boolean;
  highlightColor?: ReadingHighlight["color"];
  fontSize: number;
}) {
  const ref = React.useRef<HTMLParagraphElement | null>(null);

  const onMouseUp = () => {
    if (!highlightEnabled) return;
    const selectedText = extractSelection(ref.current);
    if (!selectedText) return;
    onCreateHighlight?.({ paragraphId: paragraph.id, language: "en", selectedText, color: highlightColor ?? "yellow" });
    window.getSelection()?.removeAllRanges();
  };

  return (
    <motion.p
      ref={ref}
      onMouseUp={onMouseUp}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="break-words whitespace-pre-wrap text-justify hyphens-auto leading-8 text-foreground select-text"
      style={{ fontSize: `${fontSize}px` }}
    >
      {renderHighlightedText(paragraph.source, highlights, paragraph.id, "en")}
    </motion.p>
  );
}

function TranslationParagraph({
  paragraph,
  highlights,
  showTranslation,
  onCreateHighlight,
  highlightEnabled,
  highlightColor,
  fontSize,
}: {
  paragraph: BilingualParagraph;
  highlights?: ReadingHighlight[];
  showTranslation: boolean;
  onCreateHighlight?: (payload: { paragraphId: string; language: "en" | "vi"; selectedText: string; color: ReadingHighlight["color"] }) => void;
  highlightEnabled?: boolean;
  highlightColor?: ReadingHighlight["color"];
  fontSize: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMouseUp = () => {
    if (!highlightEnabled) return;
    const selectedText = extractSelection(ref.current);
    if (!selectedText) return;
    onCreateHighlight?.({ paragraphId: paragraph.id, language: "vi", selectedText, color: highlightColor ?? "yellow" });
    window.getSelection()?.removeAllRanges();
  };

  return (
    <AnimatePresence initial={false}>
      {showTranslation ? (
        <motion.div
          ref={ref}
          onMouseUp={onMouseUp}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden border-l-2 border-slate-200 pl-4"
        >
          <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            <Languages className="h-3.5 w-3.5" />
            Dịch nghĩa
          </div>
          <p className="break-words whitespace-pre-wrap text-justify hyphens-auto leading-7 text-slate-600" style={{ fontSize: `${Math.max(12, fontSize - 1)}px` }}>
            {renderHighlightedText(paragraph.translation ?? "", highlights, paragraph.id, "vi")}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ReadingSection({
  paragraph,
  index,
  showTranslation,
  highlights,
  onCreateHighlight,
  highlightEnabled,
  highlightColor,
  fontSize,
}: {
  paragraph: BilingualParagraph;
  index: number;
  showTranslation: boolean;
  highlights?: ReadingHighlight[];
  onCreateHighlight?: (payload: { paragraphId: string; language: "en" | "vi"; selectedText: string; color: ReadingHighlight["color"] }) => void;
  highlightEnabled?: boolean;
  highlightColor?: ReadingHighlight["color"];
  fontSize: number;
}) {
  return (
    <div className={cn("px-5 py-5 md:px-7 md:py-6", index > 0 && "border-t border-border/60")}>
      <div className="grid gap-6 md:hidden">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Paragraph {index + 1}</div>
          <EnglishParagraph
            paragraph={paragraph}
            highlights={highlights}
            onCreateHighlight={onCreateHighlight}
            highlightEnabled={highlightEnabled}
            highlightColor={highlightColor}
            fontSize={fontSize}
          />
        </div>
        <TranslationParagraph
          paragraph={paragraph}
          highlights={highlights}
          showTranslation={showTranslation}
          onCreateHighlight={onCreateHighlight}
          highlightEnabled={highlightEnabled}
          highlightColor={highlightColor}
          fontSize={fontSize}
        />
      </div>

      <div className="hidden md:block">
        <motion.div
          layout
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "grid gap-x-8 lg:gap-x-12",
            showTranslation ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"
          )}
        >
          <div className="min-w-0 pr-1">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Paragraph {index + 1}</div>
            <EnglishParagraph
              paragraph={paragraph}
              highlights={highlights}
              onCreateHighlight={onCreateHighlight}
              highlightEnabled={highlightEnabled}
              highlightColor={highlightColor}
              fontSize={fontSize}
            />
          </div>
          {showTranslation ? (
            <motion.div
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-w-0 pl-1"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Paragraph {index + 1}</div>
              <p className="break-words whitespace-pre-wrap text-justify hyphens-auto leading-8 text-foreground select-text" style={{ fontSize: `${Math.max(12, fontSize - 1)}px` }}>
                {renderHighlightedText(paragraph.translation ?? "", highlights, paragraph.id, "vi")}
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
