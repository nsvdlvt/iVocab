"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ReadingHeader } from "./ReadingHeader";
import { ReadingToolbar, type HighlightColor } from "./ReadingToolbar";
import { ReadingSection } from "./ReadingSection";
import { ReadingNavigation } from "./ReadingNavigation";
import { ReadingComprehension } from "./ReadingComprehension";
import { VocabularyHighlight } from "./VocabularyHighlight";
import { ReadingVocabularyModal } from "./ReadingVocabularyModal";
import { motion } from "framer-motion";
import { MascotBanner } from "@/components/mascot/MascotBanner";
import { MascotCompanion } from "@/components/mascot/MascotCompanion";
import { fadeInUp, EASING } from "@/lib/motion";
import type {
  BilingualParagraph,
  ComprehensionQuestion,
  HighlightedWord,
  ReadingHighlight,
  ReadingLesson,
  ReadingMode,
} from "./reading-types";

export function ReadingWorkspace({ lesson }: { lesson: ReadingLesson }) {
  const router = useRouter();
  const MIN_FONT_SIZE = 14;
  const DEFAULT_FONT_SIZE = 18;
  const MAX_FONT_SIZE = 28;

  const FONT_SIZE_STORAGE_KEY = "ivocab:reading:font_size";
  const HIGHLIGHTS_STORAGE_KEY = `ivocab:reading:highlights:${lesson.id}`;
  const TRANSLATIONS_STORAGE_KEY = `ivocab:reading:translations:${lesson.id}`;
  const FAVORITE_STORAGE_KEY = `ivocab:reading:fav:${lesson.id}`;

  const [isFavorite, setIsFavorite] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return lesson.isFavorite;
    try {
      const saved = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : lesson.isFavorite;
    } catch {
      return lesson.isFavorite;
    }
  });

  const [mode, setMode] = React.useState<ReadingMode>("bilingual");
  const [highlightEnabled, setHighlightEnabled] = React.useState(false);
  const [highlightColor, setHighlightColor] = React.useState<HighlightColor>("yellow");
  const [highlights, setHighlights] = React.useState<ReadingHighlight[]>([]);

  // Paragraphs state allowing dynamic AI translations
  const [paragraphs, setParagraphs] = React.useState<BilingualParagraph[]>(lesson.paragraphs);
  const [translatingMap, setTranslatingMap] = React.useState<Record<string, boolean>>({});
  const [translationErrors, setTranslationErrors] = React.useState<Record<string, string | null>>({});

  // Active word for quick vocabulary card
  const [activeWord, setActiveWord] = React.useState<HighlightedWord | null>(null);
  // Full article vocabulary modal
  const [vocabModalOpen, setVocabModalOpen] = React.useState(false);

  // Comprehension questions
  const [questions, setQuestions] = React.useState<ComprehensionQuestion[]>(lesson.questions ?? []);

  // Text-to-speech audio state
  const [isPlayingAllAudio, setIsPlayingAllAudio] = React.useState(false);

  const [readingFontSize, setReadingFontSize] = React.useState(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(FONT_SIZE_STORAGE_KEY) : null;
      if (!stored) return DEFAULT_FONT_SIZE;
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
    } catch {
      // Fallback
    }
    return DEFAULT_FONT_SIZE;
  });

  // Save font size preference
  React.useEffect(() => {
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(readingFontSize));
    } catch {
      // Ignore
    }
  }, [readingFontSize, FONT_SIZE_STORAGE_KEY]);

  // Load cached translations if any
  React.useEffect(() => {
    try {
      const cached = window.localStorage.getItem(TRANSLATIONS_STORAGE_KEY);
      if (cached) {
        const map = JSON.parse(cached) as Record<string, string>;
        setParagraphs((current) =>
          current.map((p) => (map[p.id] ? { ...p, translation: map[p.id] } : p))
        );
      }
    } catch {
      // Ignore
    }
  }, [TRANSLATIONS_STORAGE_KEY]);

  // Load highlights from API and localStorage
  React.useEffect(() => {
    let cancelled = false;

    // Load from localStorage immediately for zero latency
    try {
      const local = window.localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local) as ReadingHighlight[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHighlights(parsed);
        }
      }
    } catch {
      // Ignore
    }

    // Then try API sync
    const loadApiHighlights = async () => {
      try {
        const response = await fetch(`/api/reading/highlights?articleId=${encodeURIComponent(lesson.id)}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { highlights?: ReadingHighlight[] };
        if (!cancelled && payload.highlights && payload.highlights.length > 0) {
          setHighlights(payload.highlights);
          window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(payload.highlights));
        }
      } catch {
        // Fall back gracefully to localStorage data
      }
    };

    void loadApiHighlights();
    return () => {
      cancelled = true;
    };
  }, [lesson.id, HIGHLIGHTS_STORAGE_KEY]);

  // Load or fetch comprehension questions if not already supplied
  React.useEffect(() => {
    if (questions.length > 0) return;

    let cancelled = false;
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/reading/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: lesson.slug,
            title: lesson.title,
            paragraphs: lesson.paragraphs.map((p) => p.source),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { questions?: ComprehensionQuestion[] };
        if (!cancelled && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      } catch {
        // Ignore
      }
    };

    void fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [lesson.slug, lesson.title, lesson.paragraphs, questions.length]);

  // Collect all vocabulary words across all paragraphs
  const allVocabWords = React.useMemo(() => {
    const list: HighlightedWord[] = [];
    const seen = new Set<string>();

    paragraphs.forEach((p) => {
      p.highlightedWords?.forEach((w) => {
        const lower = w.text.trim().toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push(w);
        }
      });
    });

    return list;
  }, [paragraphs]);

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleCreateHighlight = React.useCallback(
    async (payload: {
      paragraphId: string;
      language: "en" | "vi";
      selectedText: string;
      color: HighlightColor;
    }) => {
      const newHighlight: ReadingHighlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        articleId: lesson.id,
        paragraphId: payload.paragraphId,
        language: payload.language,
        selectedText: payload.selectedText,
        color: payload.color,
      };

      // Optimistically update state and localStorage
      setHighlights((current) => {
        const filtered = current.filter(
          (item) =>
            !(
              item.paragraphId === newHighlight.paragraphId &&
              item.language === newHighlight.language &&
              item.selectedText === newHighlight.selectedText
            )
        );
        const updated = [...filtered, newHighlight];
        try {
          window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });

      // Sync with API
      try {
        const response = await fetch("/api/reading/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: lesson.id,
            ...payload,
          }),
        });

        if (response.ok) {
          const result = (await response.json()) as { highlight?: ReadingHighlight };
          if (result.highlight?.id) {
            setHighlights((current) =>
              current.map((item) => (item.id === newHighlight.id ? result.highlight! : item))
            );
          }
        }
      } catch {
        // Graceful offline fallback
      }
    },
    [lesson.id, HIGHLIGHTS_STORAGE_KEY]
  );

  const handleUpdateHighlightColor = React.useCallback(
    async (highlightId: string, color: HighlightColor) => {
      setHighlights((current) => {
        const target = current.find((h) => h.id === highlightId);
        if (!target) return current;

        const updated = current.map((h) => (h.id === highlightId ? { ...h, color } : h));
        try {
          window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }

        // Sync with API
        fetch("/api/reading/highlights", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: lesson.id,
            paragraphId: target.paragraphId,
            language: target.language,
            selectedText: target.selectedText,
            color,
          }),
        }).catch(() => {});

        return updated;
      });
    },
    [lesson.id, HIGHLIGHTS_STORAGE_KEY]
  );

  const handleDeleteHighlight = React.useCallback(
    async (highlightId: string) => {
      setHighlights((current) => {
        const target = current.find((h) => h.id === highlightId);
        const updated = current.filter((h) => h.id !== highlightId);
        try {
          window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }

        if (target) {
          fetch("/api/reading/highlights", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              articleId: lesson.id,
              paragraphId: target.paragraphId,
              language: target.language,
              selectedText: target.selectedText,
            }),
          }).catch(() => {});
        }

        return updated;
      });
    },
    [lesson.id, HIGHLIGHTS_STORAGE_KEY]
  );

  const handleResetHighlights = React.useCallback(() => {
    setHighlights([]);
    try {
      window.localStorage.removeItem(HIGHLIGHTS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, [HIGHLIGHTS_STORAGE_KEY]);

  const handleTranslateParagraph = React.useCallback(
    async (paragraphId: string, englishText: string) => {
      setTranslatingMap((prev) => ({ ...prev, [paragraphId]: true }));
      setTranslationErrors((prev) => ({ ...prev, [paragraphId]: null }));

      try {
        const response = await fetch("/api/reading/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: englishText }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errData?.error || "Dịch thất bại");
        }

        const data = (await response.json()) as { translation: string };
        const translatedText = data.translation;

        setParagraphs((current) => {
          const updated = current.map((p) =>
            p.id === paragraphId ? { ...p, translation: translatedText } : p
          );

          // Save to localStorage
          try {
            const map: Record<string, string> = {};
            updated.forEach((p) => {
              if (p.translation) map[p.id] = p.translation;
            });
            window.localStorage.setItem(TRANSLATIONS_STORAGE_KEY, JSON.stringify(map));
          } catch {
            // Ignore
          }

          return updated;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Không thể dịch đoạn này.";
        setTranslationErrors((prev) => ({ ...prev, [paragraphId]: msg }));
      } finally {
        setTranslatingMap((prev) => ({ ...prev, [paragraphId]: false }));
      }
    },
    [TRANSLATIONS_STORAGE_KEY]
  );

  const handleToggleReadWholeArticle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAllAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAllAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = paragraphs.map((p) => p.source).join(". ");
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onend = () => setIsPlayingAllAudio(false);
    utterance.onerror = () => setIsPlayingAllAudio(false);

    setIsPlayingAllAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleScrollToParagraph = (paragraphIndex: number) => {
    const targetParagraph = paragraphs[paragraphIndex];
    if (!targetParagraph) return;
    const element = document.getElementById(`paragraph-${targetParagraph.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-primary/5");
      setTimeout(() => {
        element.classList.remove("bg-primary/5");
      }, 1800);
    }
  };

  const handleJumpToQuestions = () => {
    const el = document.getElementById("comprehension-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const showTranslation = mode === "bilingual";

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-8">
      <ReadingHeader
        title={lesson.title}
        topic={lesson.topic}
        difficulty={lesson.difficulty}
        readingTime={lesson.estimatedReadingTime}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <ReadingToolbar
        hideMeaning={mode === "english"}
        highlightEnabled={highlightEnabled}
        highlightColor={highlightColor}
        readingFontSize={readingFontSize}
        canZoomOut={readingFontSize > MIN_FONT_SIZE}
        canZoomIn={readingFontSize < MAX_FONT_SIZE}
        mode={mode}
        isPlayingAudio={isPlayingAllAudio}
        questionsCount={questions.length}
        onToggleHideMeaning={() => setMode((m) => (m === "english" ? "bilingual" : "english"))}
        onChangeMode={setMode}
        onToggleHighlight={() => setHighlightEnabled((v) => !v)}
        onChangeHighlightColor={setHighlightColor}
        onToggleAudio={handleToggleReadWholeArticle}
        onJumpToQuestions={handleJumpToQuestions}
        onResetHighlights={handleResetHighlights}
        onZoomOut={() => setReadingFontSize((current) => Math.max(MIN_FONT_SIZE, current - 1))}
        onZoomIn={() => setReadingFontSize((current) => Math.min(MAX_FONT_SIZE, current + 1))}
        onOpenVocabulary={() => setVocabModalOpen(true)}
        onOpenNotes={() => {}}
        onOpenSettings={() => {}}
      />

      {/* Welcome Mascot Guide Banner */}
      <MascotBanner
        state="reading"
        size="sm"
        title="Chào mừng bạn đến với bài đọc song ngữ!"
        description="Nhấp vào các từ vựng in đậm để xem nhanh giải nghĩa và phát âm chuẩn. Bạn có thể bật tắt chế độ song ngữ hoặc dùng bút dạ quang để đánh dấu các câu trọng tâm."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              🎯 Mục tiêu: Hoàn thành bài đọc & {questions.length} câu hỏi trắc nghiệm
            </span>
          </div>
        }
      />

      {/* Main Bilingual Passage Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASING.smooth }}
      >
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          {paragraphs.map((paragraph, index) => (
            <ReadingSection
              key={paragraph.id}
              paragraph={paragraph}
              index={index}
              showTranslation={showTranslation}
              mode={mode}
              highlights={highlights}
              onCreateHighlight={handleCreateHighlight}
              onUpdateHighlightColor={handleUpdateHighlightColor}
              onDeleteHighlight={handleDeleteHighlight}
              onVocabClick={setActiveWord}
              onTranslateParagraph={handleTranslateParagraph}
              translationLoading={Boolean(translatingMap[paragraph.id])}
              translationError={translationErrors[paragraph.id]}
              highlightEnabled={highlightEnabled}
              highlightColor={highlightColor}
              fontSize={readingFontSize}
            />
          ))}
        </Card>
      </motion.div>

      {/* Reading Comprehension Quiz Section */}
      <ReadingComprehension
        articleId={lesson.id}
        articleTitle={lesson.title}
        questions={questions}
        onScrollToParagraph={handleScrollToParagraph}
      />

      {/* Lesson Navigation (Prev / Next Article) */}
      <ReadingNavigation
        current={lesson.lessonIndex}
        total={lesson.lessonCount}
        progress={lesson.progress}
        onPrev={() => {
          if (lesson.previousSlug) {
            router.push(`/reading/${lesson.previousSlug}`);
          }
        }}
        onNext={() => {
          if (lesson.nextSlug) {
            router.push(`/reading/${lesson.nextSlug}`);
          }
        }}
      />

      {/* Vocabulary Card Dialog */}
      <Dialog open={Boolean(activeWord)} onOpenChange={(open) => !open && setActiveWord(null)}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">Chi tiết từ vựng</DialogTitle>
          {activeWord ? <VocabularyHighlight word={activeWord} onClose={() => setActiveWord(null)} /> : null}
        </DialogContent>
      </Dialog>

      {/* Full Article Vocabulary Modal */}
      <ReadingVocabularyModal
        open={vocabModalOpen}
        onOpenChange={setVocabModalOpen}
        words={allVocabWords}
        articleTitle={lesson.title}
      />

      {/* Floating Mascot Learning Companion */}
      <MascotCompanion />
    </div>
  );
}
