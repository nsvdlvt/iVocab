"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import {
  highlightEnglishExample,
  highlightVietnameseTranslation,
  type TextChunk,
} from "@/lib/vocabulary/highlight-words";

export interface HighlightedSentenceProps {
  sentence: string;
  type: "en" | "vi";
  targetWord?: string;
  meaning?: string;
  className?: string;
  highlightClassName?: string;
  as?: React.ElementType;
}

export const HighlightedSentence = memo(function HighlightedSentence({
  sentence,
  type,
  targetWord = "",
  meaning = "",
  className,
  highlightClassName,
  as: Component = "span",
}: HighlightedSentenceProps) {
  if (!sentence) return null;

  const chunks: TextChunk[] =
    type === "en"
      ? highlightEnglishExample(sentence, targetWord)
      : highlightVietnameseTranslation(sentence, meaning);

  const defaultHighlightClass =
    "font-semibold text-primary underline decoration-primary/40 underline-offset-4 bg-primary/10 px-1 py-0.5 rounded";

  return (
    <Component className={cn("inline leading-relaxed", className)}>
      {chunks.map((chunk, index) => {
        if (!chunk.isHighlighted) {
          return <React.Fragment key={index}>{chunk.text}</React.Fragment>;
        }

        return (
          <span
            key={index}
            className={cn(defaultHighlightClass, highlightClassName)}
          >
            {chunk.text}
          </span>
        );
      })}
    </Component>
  );
});

export interface HighlightedExampleProps {
  word: string;
  meaning: string;
  example?: string | null;
  exampleTranslation?: string | null;
  className?: string;
  compact?: boolean;
  showLabels?: boolean;
  exampleClassName?: string;
  translationClassName?: string;
}

export const HighlightedExample = memo(function HighlightedExample({
  word,
  meaning,
  example,
  exampleTranslation,
  className,
  compact = false,
  showLabels = false,
  exampleClassName,
  translationClassName,
}: HighlightedExampleProps) {
  if (!example && !exampleTranslation) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-muted/25 transition-colors",
        compact ? "p-2.5 space-y-1 text-xs" : "p-3.5 space-y-1.5 text-sm",
        className
      )}
    >
      {example && (
        <div className="space-y-0.5">
          {showLabels && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              Ví dụ (EN)
            </p>
          )}
          <p
            className={cn(
              "italic leading-relaxed text-foreground/90 select-text",
              exampleClassName
            )}
          >
            &ldquo;
            <HighlightedSentence
              sentence={example}
              type="en"
              targetWord={word}
            />
            &rdquo;
          </p>
        </div>
      )}

      {exampleTranslation && (
        <div className={cn("space-y-0.5", example && "pt-1 border-t border-border/40")}>
          {showLabels && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              Nghĩa của ví dụ
            </p>
          )}
          <p
            className={cn(
              "leading-relaxed text-muted-foreground select-text",
              compact ? "text-[11px]" : "text-xs sm:text-sm",
              translationClassName
            )}
          >
            <HighlightedSentence
              sentence={exampleTranslation}
              type="vi"
              meaning={meaning}
            />
          </p>
        </div>
      )}
    </div>
  );
});
