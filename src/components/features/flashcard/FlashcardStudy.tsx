"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle, Settings2, RotateCcw, Volume2, Speaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlashcardDeck } from "./FlashcardDeck";
import { FlashcardSettingsDialog, FlashcardSettingsState } from "./FlashcardSettingsDialog";
import { FlashcardRow } from "./flashcard-utils";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";

interface FlashcardStudyProps {
  initialWords: FlashcardRow[];
  setInfo: { id: string; title: string };
  onBackHref: string;
  readOnly?: boolean;
}

const STORAGE_KEY = "ivocab_flashcard_settings_v1";
const DEFAULT_SETTINGS: FlashcardSettingsState = {
  shuffle: false,
  autoplay: false,
  autoSpeak: false,
  autoplaySeconds: 5,
  showIpa: true,
  showExamples: true,
};

function shuffleWords(words: FlashcardRow[]) {
  const next = [...words];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function loadSettings(): FlashcardSettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<FlashcardSettingsState>;
    return {
      shuffle: Boolean(parsed.shuffle),
      autoplay: Boolean(parsed.autoplay),
      autoSpeak: Boolean(parsed.autoSpeak),
      autoplaySeconds: [3, 5, 8].includes(Number(parsed.autoplaySeconds)) ? Number(parsed.autoplaySeconds) : 5,
      showIpa: parsed.showIpa !== false,
      showExamples: parsed.showExamples !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function FlashcardStudy({ initialWords, setInfo, onBackHref, readOnly = false }: FlashcardStudyProps) {
  const router = useRouter();
  const [settings, setSettings] = React.useState<FlashcardSettingsState>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [deck, setDeck] = React.useState<FlashcardRow[]>(() => (loadSettings().shuffle ? shuffleWords(initialWords) : initialWords));
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const autoplayTimerRef = React.useRef<number | null>(null);

  const currentWord = deck[currentIndex] ?? null;
  const progress = deck.length > 0 ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;
  usePreserveScrollPosition(currentWord?.id ?? (deck.length === 0 ? "empty" : `${currentIndex}`));

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<FlashcardSettingsState>;
        setSettings({
          shuffle: Boolean(parsed.shuffle),
          autoplay: Boolean(parsed.autoplay),
          autoSpeak: Boolean(parsed.autoSpeak),
          autoplaySeconds: [3, 5, 8].includes(Number(parsed.autoplaySeconds)) ? Number(parsed.autoplaySeconds) : 5,
          showIpa: parsed.showIpa !== false,
          showExamples: parsed.showExamples !== false,
        });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  React.useEffect(() => {
    if (!settings.autoplay || flipped || deck.length === 0) {
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
      return;
    }

    autoplayTimerRef.current = window.setTimeout(() => {
      setFlipped(true);
    }, settings.autoplaySeconds * 1000);

    return () => {
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
    };
  }, [settings.autoplay, settings.autoplaySeconds, flipped, deck.length]);

  const persistSettings = React.useCallback((next: FlashcardSettingsState) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettings(next);
  }, []);

  const handleToggleShuffle = React.useCallback(() => {
    const next = { ...settings, shuffle: !settings.shuffle };
    persistSettings(next);
    setDeck(next.shuffle ? shuffleWords(initialWords) : initialWords);
    setCurrentIndex(0);
    setFlipped(false);
  }, [initialWords, persistSettings, settings]);

  const handlePrevious = React.useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setFlipped(false);
  }, []);

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => Math.min(deck.length - 1, prev + 1));
    setFlipped(false);
  }, [deck.length]);

  const handleRestart = React.useCallback(() => {
    setDeck(settings.shuffle ? shuffleWords(initialWords) : initialWords);
    setCurrentIndex(0);
    setFlipped(false);
  }, [initialWords, settings.shuffle]);

  const handleSpeak = React.useCallback(() => {
    if (!currentWord || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  React.useEffect(() => {
    if (!settings.autoSpeak || !currentWord) return;
    const handle = window.setTimeout(() => {
      handleSpeak();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [currentWord, handleSpeak, settings.autoSpeak]);

  const handleFlip = React.useCallback(() => setFlipped((prev) => !prev), []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.code === "Space") {
        event.preventDefault();
        handleFlip();
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.code === "Escape") {
        event.preventDefault();
        router.push(onBackHref);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrevious, onBackHref, router]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    if (dx > 0) handlePrevious();
    else handleNext();
  };

  if (deck.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="rounded-xl">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{setInfo.title}</h1>
            <p className="text-xs text-muted-foreground">No cards available in this set.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Add vocabulary to start studying flashcards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(onBackHref)} className="mt-0.5 rounded-xl">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{setInfo.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Học tập hiệu quả với Flashcard</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {currentIndex + 1} / {deck.length}
          </Badge>
          {readOnly && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Read only
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} className="rounded-xl text-xs font-semibold">
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Progress</span>
          <span>
            {currentIndex + 1} / {deck.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="pt-2"
      >
        <FlashcardDeck
          word={currentWord}
          flipped={flipped}
          showIpa={settings.showIpa}
          showExamples={settings.showExamples}
          onFlip={handleFlip}
          onSpeak={handleSpeak}
        />
      </motion.div>

      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-4 text-center shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="rounded-xl">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={handleFlip} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
            Flip
          </Button>
          <Button variant="outline" onClick={handleNext} disabled={currentIndex === deck.length - 1} className="rounded-xl">
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Button variant={settings.shuffle ? "secondary" : "ghost"} size="sm" onClick={handleToggleShuffle} className="rounded-xl text-xs font-semibold">
            <Shuffle className="mr-1 h-3.5 w-3.5" />
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSpeak} className="rounded-xl text-xs font-semibold">
            <Volume2 className="mr-1 h-3.5 w-3.5" />
            Speak
          </Button>
          <Button
            variant={settings.autoSpeak ? "secondary" : "ghost"}
            size="sm"
            onClick={() => persistSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
            className="rounded-xl text-xs font-semibold"
          >
            <Speaker className="mr-1 h-3.5 w-3.5" />
            Auto speak
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart} className="rounded-xl text-xs font-semibold">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Restart
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Shortcuts: <span className="font-semibold text-foreground">Space</span> flip, <span className="font-semibold text-foreground">←</span> previous,{" "}
        <span className="font-semibold text-foreground">→</span> next.
      </div>

      <FlashcardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(next) => {
          persistSettings(next);
          if (next.shuffle !== settings.shuffle) {
            setDeck(next.shuffle ? shuffleWords(initialWords) : initialWords);
            setCurrentIndex(0);
            setFlipped(false);
          }
        }}
      />
    </div>
  );
}
