"use client";

import React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ReadingHeader } from "./ReadingHeader";
import { ReadingToolbar, type ReadingMode } from "./ReadingToolbar";
import { ReadingSection } from "./ReadingSection";
import { ReadingNavigation } from "./ReadingNavigation";
import { VocabularyHighlight } from "./VocabularyHighlight";
import type { HighlightedWord, ReadingLesson } from "./reading-types";
import { useMediaQuery } from "@/hooks/use-media-query";

type Panel = "vocabulary" | "notes" | null;

function VocabPanel({ lesson }: { lesson: ReadingLesson }) {
  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Từ vựng trong bài</div>
      <div className="space-y-3">
        {lesson.sections.flatMap((section) => section.blocks).flatMap((block) =>
          (block.highlightedWords ?? []).map((word) => (
            <div key={`${block.id}-${word.text}`} className="rounded-xl border border-border/60 bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{word.text}</div>
                  <div className="text-sm text-muted-foreground">{word.meaning}</div>
                </div>
                <div className="text-xs text-muted-foreground">{word.vocabularyId ? "★ Đã lưu" : "+ Thêm"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesPanel() {
  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ghi chú</div>
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">+ Thêm ghi chú</div>
    </div>
  );
}

export function ReadingWorkspace({ lesson }: { lesson: ReadingLesson }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isFavorite, setIsFavorite] = React.useState(lesson.isFavorite);
  const [hideMeaning, setHideMeaning] = React.useState(false);
  const [highlightEnabled, setHighlightEnabled] = React.useState(true);
  const [readingMode, setReadingMode] = React.useState<ReadingMode>("bilingual");
  const [activeWord, setActiveWord] = React.useState<HighlightedWord | null>(null);
  const [openPanel, setOpenPanel] = React.useState<Panel>(null);
  const [expandedParagraphs, setExpandedParagraphs] = React.useState<Record<string, boolean>>({});

  const showTranslation = readingMode !== "english-only";

  const toggleParagraph = (paragraphId: string) => setExpandedParagraphs((curr) => ({ ...curr, [paragraphId]: !curr[paragraphId] }));

  return (
    <div className="space-y-4">
      <ReadingHeader
        title={lesson.title}
        topic={lesson.topic}
        difficulty={lesson.difficulty}
        readingTime={lesson.estimatedReadingTime}
        newWords={lesson.vocabularyStats.newWords}
        knownWords={lesson.vocabularyStats.knownWords}
        totalHighlighted={lesson.vocabularyStats.totalHighlighted}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((v) => !v)}
      />

      <ReadingToolbar
        hideMeaning={hideMeaning}
        highlightEnabled={highlightEnabled}
        readingMode={readingMode}
        onToggleHideMeaning={() => setHideMeaning((v) => !v)}
        onToggleHighlight={() => setHighlightEnabled((v) => !v)}
        onChangeReadingMode={setReadingMode}
        onOpenNotes={() => setOpenPanel("notes")}
        onOpenVocabulary={() => setOpenPanel("vocabulary")}
        onOpenSettings={() => {}}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {lesson.sections.map((section) => (
            <ReadingSection
              key={section.id}
              section={section}
              languageLabel={lesson.sourceLanguage}
              showTranslation={showTranslation}
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

        {!isMobile && openPanel ? (
          <aside className="sticky top-24 h-fit rounded-2xl border border-border/60 bg-card shadow-sm">
            {openPanel === "vocabulary" ? <VocabPanel lesson={lesson} /> : <NotesPanel />}
          </aside>
        ) : null}
      </div>

      {isMobile ? (
        <Sheet open={openPanel !== null} onOpenChange={(open) => setOpenPanel(open ? openPanel ?? "vocabulary" : null)}>
          <SheetContent side="right" className="w-[min(90vw,26rem)]">
            <SheetTitle className="sr-only">Reading panel</SheetTitle>
            {openPanel === "vocabulary" ? <VocabPanel lesson={lesson} /> : <NotesPanel />}
          </SheetContent>
        </Sheet>
      ) : null}

      <div className="pointer-events-none fixed bottom-4 right-4">
        {activeWord ? <VocabularyHighlight word={activeWord} onClose={() => setActiveWord(null)} /> : null}
      </div>
    </div>
  );
}
