"use client";

import React from "react";
import { BookOpenText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReadingHeader } from "./ReadingHeader";
import { ReadingToolbar } from "./ReadingToolbar";
import { ReadingSection } from "./ReadingSection";
import { ReadingNavigation } from "./ReadingNavigation";
import { TranslationControls } from "./TranslationControls";
import { VocabularyHighlight } from "./VocabularyHighlight";
import type { HighlightedWord, ReadingLesson } from "./reading-types";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ReadingMode } from "./ReadingToolbar";

export function BilingualReader({ lesson }: { lesson: ReadingLesson }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isFavorite, setIsFavorite] = React.useState(lesson.isFavorite);
  const [hideMeaning, setHideMeaning] = React.useState(false);
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [highlightEnabled, setHighlightEnabled] = React.useState(true);
  const [readingMode, setReadingMode] = React.useState<ReadingMode>("bilingual");
  const [activeWord, setActiveWord] = React.useState<HighlightedWord | null>(null);
  const [expandedParagraphs, setExpandedParagraphs] = React.useState<Record<string, boolean>>({});

  const showBilingual = readingMode === "bilingual" && showTranslation;
  const showTranslationOnDemand = readingMode === "translation-on-demand";

  const toggleParagraph = (paragraphId: string) => {
    setExpandedParagraphs((current) => ({ ...current, [paragraphId]: !current[paragraphId] }));
  };

  return (
    <div className="space-y-6">
      <ReadingHeader
        title={lesson.title}
        topic={lesson.topic}
        difficulty={lesson.difficulty}
        readingTime={lesson.estimatedReadingTime}
        newWords={lesson.vocabularyStats.newWords}
        knownWords={lesson.vocabularyStats.knownWords}
        totalHighlighted={lesson.vocabularyStats.totalHighlighted}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((value) => !value)}
      />

      <ReadingToolbar
        hideMeaning={hideMeaning}
        highlightEnabled={highlightEnabled}
        readingMode={readingMode}
        onToggleHideMeaning={() => setHideMeaning((value) => !value)}
        onToggleShowTranslation={() => setShowTranslation((value) => !value)}
        onToggleHighlight={() => setHighlightEnabled((value) => !value)}
        onChangeReadingMode={setReadingMode}
        onOpenNotes={() => {}}
        onOpenVocabulary={() => {}}
        onOpenSettings={() => {}}
      />

      <div className="grid gap-4">
        <TranslationControls showTranslation={showTranslation} onToggle={() => setShowTranslation((value) => !value)} />

        {lesson.sections.map((section) => (
          <ReadingSection
            key={section.id}
            section={section}
            languageLabel={lesson.sourceLanguage}
            showTranslation={showBilingual || showTranslationOnDemand}
            expandedParagraphs={expandedParagraphs}
            onToggleParagraph={toggleParagraph}
            onWordClick={highlightEnabled ? setActiveWord : undefined}
            isMobile={isMobile}
            mode={readingMode}
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
