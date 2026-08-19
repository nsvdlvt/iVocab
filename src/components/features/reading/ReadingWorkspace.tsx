"use client";

import React from "react";
import { createClient } from "@/lib/supabase/client";
import { ReadingHeader } from "./ReadingHeader";
import { ReadingToolbar, type HighlightColor } from "./ReadingToolbar";
import { ReadingSection } from "./ReadingSection";
import { Card } from "@/components/ui/card";
import type { ReadingHighlight, ReadingLesson } from "./reading-types";

export function ReadingWorkspace({ lesson }: { lesson: ReadingLesson }) {
  const MIN_FONT_SIZE = 14;
  const DEFAULT_FONT_SIZE = 18;
  const MAX_FONT_SIZE = 28;
  const STORAGE_KEY = "reading_font_size";

  const [isFavorite, setIsFavorite] = React.useState(lesson.isFavorite);
  const [hideMeaning, setHideMeaning] = React.useState(false);
  const [highlightEnabled, setHighlightEnabled] = React.useState(false);
  const [highlightColor, setHighlightColor] = React.useState<HighlightColor>("yellow");
  const [highlights, setHighlights] = React.useState<ReadingHighlight[]>([]);
  const [readingFontSize, setReadingFontSize] = React.useState(DEFAULT_FONT_SIZE);

  const showTranslation = !hideMeaning;

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        setReadingFontSize(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed)));
      }
    } catch {
      // Ignore storage issues and fall back to the default size.
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(readingFontSize));
  }, [readingFontSize]);

  const handleCreateHighlight = React.useCallback(
    async (payload: {
      paragraphId: string;
      language: "en" | "vi";
      selectedText: string;
      color: HighlightColor;
    }) => {
      const response = await fetch("/api/reading/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: lesson.id,
          ...payload,
        }),
      });

      if (!response.ok) return;

      const result = (await response.json()) as { highlight?: ReadingHighlight };
      if (!result.highlight) return;

      setHighlights((current) => {
        const filtered = current.filter(
          (item) =>
            !(
              item.articleId === lesson.id &&
              item.paragraphId === result.highlight!.paragraphId &&
              item.language === result.highlight!.language &&
              item.selectedText === result.highlight!.selectedText
            )
        );
        return [...filtered, result.highlight!];
      });
    },
    [lesson.id]
  );

  const handleZoomOut = React.useCallback(() => {
    setReadingFontSize((current) => Math.max(MIN_FONT_SIZE, current - 1));
  }, []);

  const handleZoomIn = React.useCallback(() => {
    setReadingFontSize((current) => Math.min(MAX_FONT_SIZE, current + 1));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loadHighlights = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          if (!cancelled) setHighlights([]);
          return;
        }
        const response = await fetch(`/api/reading/highlights?articleId=${encodeURIComponent(lesson.id)}`);
        const payload = (await response.json()) as { highlights?: ReadingHighlight[] };
        if (!cancelled) setHighlights(payload.highlights ?? []);
      } finally {
        void cancelled;
      }
    };

    void loadHighlights();
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-8">
      <ReadingHeader
        title={lesson.title}
        topic={lesson.topic}
        difficulty={lesson.difficulty}
        readingTime={lesson.estimatedReadingTime}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((v) => !v)}
      />

      <ReadingToolbar
        hideMeaning={hideMeaning}
        highlightEnabled={highlightEnabled}
        highlightColor={highlightColor}
        readingFontSize={readingFontSize}
        canZoomOut={readingFontSize > MIN_FONT_SIZE}
        canZoomIn={readingFontSize < MAX_FONT_SIZE}
        onToggleHideMeaning={() => setHideMeaning((v) => !v)}
        onToggleHighlight={() => setHighlightEnabled((v) => !v)}
        onChangeHighlightColor={setHighlightColor}
        onZoomOut={handleZoomOut}
        onZoomIn={handleZoomIn}
        onOpenNotes={() => {}}
        onOpenVocabulary={() => {}}
        onOpenSettings={() => {}}
      />

      <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
        {lesson.paragraphs.map((paragraph, index) => (
          <ReadingSection
            key={paragraph.id}
            paragraph={paragraph}
            index={index}
            showTranslation={showTranslation}
            highlights={highlights}
            onCreateHighlight={handleCreateHighlight}
            highlightEnabled={highlightEnabled}
            highlightColor={highlightColor}
            fontSize={readingFontSize}
          />
        ))}
      </Card>
    </div>
  );
}
