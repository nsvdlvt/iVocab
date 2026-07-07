"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database";
import { FlashcardCard } from "./FlashcardCard";
import { FlashcardToolbar } from "./FlashcardToolbar";
import { FlashcardProgress } from "./FlashcardProgress";
import { FlashcardSummary } from "./FlashcardSummary";
import { EmptyFlashcard } from "./EmptyFlashcard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface FlashcardViewerProps {
  initialWords: VocabularyRow[];
  setInfo: { id: string; title: string };
  onBack: () => void;
  readOnly?: boolean;
}

export function FlashcardViewer({ initialWords, setInfo, onBack, readOnly = false }: FlashcardViewerProps) {
  const router = useRouter();

  // Core words state
  const [originalWords] = useState<VocabularyRow[]>(initialWords);
  const [sessionWords, setSessionWords] = useState<VocabularyRow[]>(initialWords);

  // Layout display states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isProgressMode, setIsProgressMode] = useState(false);

  // Hidden visibility states
  const [hideIpa, setHideIpa] = useState(false);
  const [hideExample, setHideExample] = useState(false);

  // Progress groups
  const [remainingWords, setRemainingWords] = useState<VocabularyRow[]>(initialWords);
  const [knownWords, setKnownWords] = useState<VocabularyRow[]>([]);
  const [learningWords, setLearningWords] = useState<VocabularyRow[]>([]);

  // Statistics tracker states
  const [round, setRound] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [roundDialogOpened, setRoundDialogOpened] = useState(false);
  
  // Accuracy analytics tracker
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);

  // Timer parameters
  const [elapsedTime, setElapsedTime] = useState(0);
  const startedAt = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up timer trigger
  useEffect(() => {
    startedAt.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  const speakTextWeb = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, []);

  // Audio speaker logic helper
  const handleSpeak = useCallback((wordText: string, audioUrl: string | null) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.warn("Could not play custom audio, falling back to Web Speech", err);
        speakTextWeb(wordText);
      });
    } else {
      speakTextWeb(wordText);
    }
  }, [speakTextWeb]);

  // Navigations controllers
  const handleNext = useCallback(() => {
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, sessionWords.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Classification logic (Chưa thuộc / Đã thuộc)
  const handleClassification = useCallback(
    (isKnown: boolean) => {
      const currentWord = sessionWords[currentIndex];
      if (!currentWord) return;

      // Track attempts for accuracy
      setTotalAttempts((prev) => prev + 1);
      if (isKnown) {
        setCorrectAttempts((prev) => prev + 1);
      }

      setRemainingWords((prev) => prev.filter((w) => w.id !== currentWord.id));

      if (isKnown) {
        setKnownWords((prev) => {
          if (prev.some((w) => w.id === currentWord.id)) return prev;
          return [...prev, currentWord];
        });
        setLearningWords((prev) => prev.filter((w) => w.id !== currentWord.id));
      } else {
        setLearningWords((prev) => {
          if (prev.some((w) => w.id === currentWord.id)) return prev;
          return [...prev, currentWord];
        });
        setKnownWords((prev) => prev.filter((w) => w.id !== currentWord.id));
      }

      // Transition forward or evaluate round status
      if (currentIndex < sessionWords.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Reached end of current lists
        const willHaveLearning = isKnown
          ? learningWords.filter((w) => w.id !== currentWord.id).length > 0
          : true;

        if (willHaveLearning) {
          // Open new round dialogue
          setRoundDialogOpened(true);
        } else {
          // All words learned successfully
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    },
    [currentIndex, sessionWords, learningWords]
  );

  // Round loop prompt handlers
  const handleContinueRound = () => {
    // Session list becomes only the learning words
    const nextRoundWords = [...learningWords];
    setSessionWords(nextRoundWords);
    setRemainingWords(nextRoundWords);
    setLearningWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRound((prev) => prev + 1);
    setRoundDialogOpened(false);
  };

  const handleFinishRoundEarly = () => {
    setRoundDialogOpened(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Shuffle controller
  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    
    // Shuffle the layout words list
    // Shuffle the layout words list
    const shuffled = [...originalWords];
    if (nextShuffle) {
      shuffled.sort(() => Math.random() - 0.5);
    }
    
    setSessionWords(shuffled);
    setRemainingWords(shuffled);
    setKnownWords([]);
    setLearningWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRound(1);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    
    // Reset timer
    startedAt.current = Date.now();
    setElapsedTime(0);
  };

  const handleToggleProgressMode = () => {
    setIsProgressMode((prev) => !prev);
    // Restart progress classifications on toggle
    setRemainingWords(sessionWords);
    setKnownWords([]);
    setLearningWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Global reset restart state
  const handleRestart = () => {
    const list = [...originalWords];
    if (isShuffle) {
      list.sort(() => Math.random() - 0.5);
    }
    setSessionWords(list);
    setRemainingWords(list);
    setKnownWords([]);
    setLearningWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRound(1);
    setIsFinished(false);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    
    startedAt.current = Date.now();
    setElapsedTime(0);
  };

  // Keyboard Navigation Bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");
      if (isInput) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowLeft":
          if (!isProgressMode) {
            e.preventDefault();
            handlePrev();
          }
          break;
        case "ArrowRight":
          if (!isProgressMode) {
            e.preventDefault();
            handleNext();
          }
          break;
        case "KeyX":
          if (isProgressMode && !isFinished && !roundDialogOpened) {
            e.preventDefault();
            handleClassification(false);
          }
          break;
        case "KeyV":
          if (isProgressMode && !isFinished && !roundDialogOpened) {
            e.preventDefault();
            handleClassification(true);
          }
          break;
        case "Escape":
          e.preventDefault();
          onBack();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handlePrev, handleNext, handleClassification, isProgressMode, isFinished, roundDialogOpened, onBack]);

  // Format Elapsed Timer layout
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} giây`;
    return `${minutes} phút ${secs} giây`;
  };

  // Empty state layouts fallback trigger
  if (originalWords.length === 0) {
    return (
      <EmptyFlashcard
        onBack={onBack}
        onAddWords={() => router.push(`/vocabulary/${setInfo.id}/edit`)}
        readOnly={readOnly}
      />
    );
  }

  // Summary finish page rendering check
  if (isFinished) {
    const accuracyValue = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
    return (
      <FlashcardSummary
        totalCards={originalWords.length}
        rounds={round}
        accuracy={accuracyValue}
        timeString={formatTime(elapsedTime)}
        onRestart={handleRestart}
        onBackToSet={onBack}
      />
    );
  }

  const currentWord = sessionWords[currentIndex];

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-xl hover:bg-muted/80 cursor-pointer shrink-0"
            title="Thoát (Esc)"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground truncate max-w-sm sm:max-w-md">
              {setInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Học chế độ thẻ ghi nhớ</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 shrink-0 bg-muted/30 px-3 py-1.5 rounded-xl border w-fit">
          <span>Thời gian: {formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Reusable card interface */}
      <div className="py-2">
        {currentWord && (
          <FlashcardCard
            word={currentWord}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            hideIpa={hideIpa}
            hideExample={hideExample}
            onSpeak={(e) => {
              e.stopPropagation();
              handleSpeak(currentWord.word, currentWord.audio_url);
            }}
          />
        )}
      </div>

      {/* Progress metrics and indices */}
      <FlashcardProgress
        currentIndex={currentIndex}
        totalCards={sessionWords.length}
        isProgressMode={isProgressMode}
        knownCount={knownWords.length}
        learningCount={learningWords.length}
        remainingCount={remainingWords.length}
      />

      {/* Controller inputs */}
      {!isProgressMode ? (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-12 w-12 rounded-full cursor-pointer hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={handleFlip}
            className="rounded-2xl h-11 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs select-none"
          >
            Lật thẻ
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === sessionWords.length - 1}
            className="h-12 w-12 rounded-full cursor-pointer hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            variant="outline"
            onClick={() => handleClassification(false)}
            className="rounded-2xl border-rose-500/20 text-rose-600 hover:text-rose-700 hover:bg-rose-500/5 h-12 px-6 text-xs font-extrabold cursor-pointer gap-2"
          >
            <XCircle className="h-4.5 w-4.5" />
            Chưa thuộc (X)
          </Button>

          <Button
            variant="outline"
            onClick={() => handleClassification(true)}
            className="rounded-2xl border-emerald-500/20 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5 h-12 px-6 text-xs font-extrabold cursor-pointer gap-2"
          >
            <Check className="h-4.5 w-4.5" />
            Đã thuộc (V)
          </Button>
        </div>
      )}

      {/* Bottom Tool Utilities */}
      <div className="border-t pt-4">
        <FlashcardToolbar
          isShuffle={isShuffle}
          isProgressMode={isProgressMode}
          hideIpa={hideIpa}
          hideExample={hideExample}
          onToggleShuffle={handleToggleShuffle}
          onToggleProgressMode={handleToggleProgressMode}
          onToggleIpa={() => setHideIpa((p) => !p)}
          onToggleExample={() => setHideExample((p) => !p)}
          onSpeak={() => currentWord && handleSpeak(currentWord.word, currentWord.audio_url)}
          onRestart={handleRestart}
        />
      </div>

      {/* Round Complete Dialogue Popup Modal */}
      <Dialog open={roundDialogOpened} onOpenChange={setRoundDialogOpened}>
        <DialogContent className="rounded-2xl max-w-sm p-5 border shadow-xl bg-card">
          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="text-base font-extrabold text-foreground">Vòng học hoàn thành!</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bạn đã xem hết từ vựng của vòng học {round}. Vẫn còn {learningWords.length} từ chưa thuộc. Bạn muốn tiếp tục ôn tập hay dừng lại?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
            <Button
              variant="ghost"
              onClick={handleFinishRoundEarly}
              className="rounded-xl h-10 w-full text-xs font-medium cursor-pointer"
            >
              Kết thúc
            </Button>
            <Button
              onClick={handleContinueRound}
              className="rounded-xl h-10 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tiếp tục ôn tập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
