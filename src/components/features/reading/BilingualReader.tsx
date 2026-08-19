"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReadingHeader } from "./ReadingHeader";
import { ReadingToolbar } from "./ReadingToolbar";
import { ReadingSection } from "./ReadingSection";
import { ReadingNavigation } from "./ReadingNavigation";
import { TranslationControls } from "./TranslationControls";
import { VocabularyHighlight } from "./VocabularyHighlight";
import type { HighlightedWord, ReadingLesson } from "./reading-types";

export function BilingualReader({ lesson }: { lesson: ReadingLesson }) {
  const [isFavorite, setIsFavorite] = React.useState(lesson.isFavorite);
  const [hideMeaning, setHideMeaning] = React.useState(false);
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [highlightEnabled, setHighlightEnabled] = React.useState(true);
  const [activeWord, setActiveWord] = React.useState<HighlightedWord | null>(null);
  const [readingFontSize] = React.useState(18);

  return (
    <div className="space-y-6">
      <ReadingHeader
        title={lesson.title}
        topic={lesson.topic}
        difficulty={lesson.difficulty}
        readingTime={lesson.estimatedReadingTime}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((value) => !value)}
      />

      <ReadingToolbar
        hideMeaning={hideMeaning}
        highlightEnabled={highlightEnabled}
        highlightColor="yellow"
        readingFontSize={readingFontSize}
        canZoomOut
        canZoomIn
        onToggleHideMeaning={() => setHideMeaning((value) => !value)}
        onToggleHighlight={() => setHighlightEnabled((value) => !value)}
        onZoomOut={() => {}}
        onZoomIn={() => {}}
        onChangeHighlightColor={() => {}}
        onOpenNotes={() => {}}
        onOpenVocabulary={() => {}}
        onOpenSettings={() => {}}
      />

      <div className="grid gap-4">
        <TranslationControls showTranslation={showTranslation} onToggle={() => setShowTranslation((value) => !value)} />

        {lesson.paragraphs.map((paragraph, index) => (
          <ReadingSection
            key={paragraph.id}
            paragraph={paragraph}
            index={index}
            showTranslation={showTranslation}
            highlightEnabled={highlightEnabled}
            fontSize={readingFontSize}
          />
        ))}

        <ReadingNavigation
          current={lesson.lessonIndex}
          total={lesson.lessonCount}
          progress={lesson.progress}
          onPrev={() => {}}
          onNext={() => {}}
        />
      </div>

      <Dialog open={Boolean(activeWord)} onOpenChange={(open) => !open && setActiveWord(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Vocabulary highlight</DialogTitle>
          {activeWord ? <VocabularyHighlight word={activeWord} onClose={() => setActiveWord(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
