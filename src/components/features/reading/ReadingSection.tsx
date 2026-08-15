"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { highlightClassName } from "./VocabularyHighlight";
import type { BilingualParagraph, BilingualSection, HighlightedWord } from "./reading-types";

function renderHighlightedText(text: string, highlightedWords?: HighlightedWord[], onWordClick?: (word: HighlightedWord) => void) {
  if (!highlightedWords?.length) return text;
  const sorted = [...highlightedWords].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((word, index) => {
    const start = word.start ?? text.indexOf(word.text, cursor);
    const end = word.end ?? (start >= 0 ? start + word.text.length : -1);
    if (start < 0 || end < 0) return;
    if (start > cursor) parts.push(<span key={`text-${index}`}>{text.slice(cursor, start)}</span>);
    parts.push(
      <button key={`${word.text}-${index}`} type="button" onClick={() => onWordClick?.(word)} className={cn("inline-flex", highlightClassName(word.highlightColor))}>
        {text.slice(start, end)}
      </button>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return parts;
}

function Paragraph({
  paragraph,
  translationVisible,
  translationExpanded,
  onToggleTranslation,
  onWordClick,
}: {
  paragraph: BilingualParagraph;
  translationVisible: boolean;
  translationExpanded: boolean;
  onToggleTranslation: () => void;
  onWordClick?: (word: HighlightedWord) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="text-[15px] leading-8 text-foreground">
        {renderHighlightedText(paragraph.source, paragraph.highlightedWords, onWordClick)}
      </div>
      {translationVisible ? (
        <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-muted/35 p-3 text-[15px] leading-8 text-foreground transition-all", translationExpanded ? "max-h-[24rem] opacity-100" : "max-h-0 p-0 opacity-0")}>
          {paragraph.translation}
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={onToggleTranslation} className="rounded-full">
          <ChevronDown className="h-4 w-4" />
          Hiện nghĩa tiếng Việt
        </Button>
      )}
    </div>
  );
}

export function ReadingSection({
  section,
  languageLabel,
  showTranslation,
  expandedParagraphs,
  onToggleParagraph,
  onWordClick,
  isMobile,
  mode,
}: {
  section: BilingualSection;
  languageLabel: string;
  showTranslation: boolean;
  expandedParagraphs: Record<string, boolean>;
  onToggleParagraph: (paragraphId: string) => void;
  onWordClick?: (word: HighlightedWord) => void;
  isMobile: boolean;
  mode: "bilingual" | "english-only" | "read-first";
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/60 px-5 py-4">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{languageLabel}</div>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{section.sourceTitle}</h2>
        <p className="text-sm text-muted-foreground">{section.translatedTitle}</p>
      </div>
      <div className={cn("grid gap-4 p-5", isMobile ? "grid-cols-1" : "grid-cols-2")}>
        {section.blocks.map((paragraph) => (
          <Paragraph
            key={paragraph.id}
            paragraph={paragraph}
            translationVisible={showTranslation}
            translationExpanded={mode === "bilingual" ? true : Boolean(expandedParagraphs[paragraph.id])}
            onToggleTranslation={() => onToggleParagraph(paragraph.id)}
            onWordClick={onWordClick}
          />
        ))}
      </div>
    </Card>
  );
}
