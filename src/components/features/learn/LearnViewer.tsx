"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database";
import { LearnSettings, LearnSettingsDialog } from "./LearnSettingsDialog";
import { StudyProgress } from "../study/StudyProgress";
import { LearnMCQ } from "./LearnMCQ";
import { LearnInput } from "./LearnInput";
import { StudyExplanation } from "../study/StudyExplanation";
import { StudySummary } from "../study/StudySummary";
import { EmptyFlashcard } from "../flashcard/EmptyFlashcard";

import { LearnQuestion, AnswerState } from "@/lib/learning/question-types";
import { QuestionGenerator } from "@/lib/learning/question-generator";
import { checkEnglishAnswer, checkVietnameseAnswer } from "@/lib/learning/answer-checker";
import { AdaptiveEngine, LearningState as LearnWordState, RecentQuestionConfig } from "@/lib/learning/adaptive-engine";
import { SESSION_CONFIG } from "@/lib/learning/config";
import { useSpeak } from "@/hooks/use-speak";
import { usePreserveScrollPosition } from "@/hooks/use-preserve-scroll-position";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface LearnViewerProps {
  initialWords: VocabularyRow[];
  setInfo: { id: string; title: string };
  onBack: () => void;
  reviewSessionId?: string;
}

const getStorageKey = (setId: string) => `ivocab_learn_v${SESSION_CONFIG.STORAGE_VERSION}_${setId}`;
const getSettingsStorageKey = (setId: string) => `ivocab_learn_settings_v${SESSION_CONFIG.STORAGE_VERSION}_${setId}`;

interface SerializedSession {
  wordStates: LearnWordState[];
  recentAskedIds: string[];
  recentConfigs: RecentQuestionConfig[];
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  elapsedTime: number;
  settings: LearnSettings;
  timestamp: number;
}

export function LearnViewer({ initialWords, setInfo, onBack, reviewSessionId }: LearnViewerProps) {
  const router = useRouter();
  const settingsKey = getSettingsStorageKey(setInfo.id);

  // Active configurations
  const [settings, setSettings] = useState<LearnSettings>(() => {
    if (typeof window === "undefined") {
      return {
        directionEnVi: true,
        directionViEn: true,
        typeMcq: true,
        typeInput: true,
        onlyLearning: false,
        orderRandom: true,
        autoContinue: true,
      };
    }

    const stored = window.localStorage.getItem(settingsKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<LearnSettings>;
        return {
          directionEnVi: parsed.directionEnVi ?? true,
          directionViEn: parsed.directionViEn ?? true,
          typeMcq: parsed.typeMcq ?? true,
          typeInput: parsed.typeInput ?? true,
          onlyLearning: parsed.onlyLearning ?? false,
          orderRandom: parsed.orderRandom ?? true,
          autoContinue: parsed.autoContinue ?? true,
        };
      } catch (error) {
        console.warn("Failed to restore learn settings", error);
        window.localStorage.removeItem(settingsKey);
      }
    }

    return {
      directionEnVi: true,
      directionViEn: true,
      typeMcq: true,
      typeInput: true,
      onlyLearning: false,
      orderRandom: true,
      autoContinue: true,
    };
  });

  const [settingsOpened, setSettingsOpened] = useState(false);

  // Core words state queue
  const [wordStates, setWordStates] = useState<LearnWordState[]>(() =>
    AdaptiveEngine.initializeStates(initialWords)
  );

  // Active session parameters
  const [currentQuestion, setCurrentQuestion] = useState<LearnQuestion | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");

  // Selection states
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Autoplay setting toggles (independent)
  const [autoPlayQuestionAudio, setAutoPlayQuestionAudio] = useState(true);
  const [autoPlayExplanationAudio, setAutoPlayExplanationAudio] = useState(true);

  // Reusable Audio Speak Hook
  const { speakText, triggerAutoplay } = useSpeak();

  // Round stats trackers
  const [recentAskedIds, setRecentAskedIds] = useState<string[]>([]);
  const [recentConfigs, setRecentConfigs] = useState<RecentQuestionConfig[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Exit & Resume Confirmation Dialogs
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [pendingSessionData, setPendingSessionData] = useState<SerializedSession | null>(null);

  // Timer tracker
  const [elapsedTime, setElapsedTime] = useState(0);
  const startedAt = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinished) return;
    startedAt.current = Date.now() - elapsedTime * 1000;
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, elapsedTime]);

  // localStorage Restore effect
  useEffect(() => {
    const key = getStorageKey(setInfo.id);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data: SerializedSession = JSON.parse(stored);
        // Expiration check (configurable expiration time hours convert to ms)
        const expirationMs = SESSION_CONFIG.SESSION_EXPIRE_HOURS * 60 * 60 * 1000;
        const expired = Date.now() - data.timestamp > expirationMs;
        if (expired) {
          localStorage.removeItem(key);
        } else {
          const handle = setTimeout(() => {
            setPendingSessionData(data);
            setResumePromptOpen(true);
          }, 0);
          return () => clearTimeout(handle);
        }
      } catch (e) {
        console.warn("Failed to restore serialized session schema", e);
        localStorage.removeItem(key);
      }
    }
  }, [setInfo.id]);

  // Debounced persistence helper
  const saveSessionState = useCallback(
    (statesList: LearnWordState[], confsList: RecentQuestionConfig[], askedIds: string[], tQ: number, cC: number, wC: number, elapsed: number, s: LearnSettings) => {
      const data: SerializedSession = {
        wordStates: statesList,
        recentAskedIds: askedIds,
        recentConfigs: confsList,
        totalQuestions: tQ,
        correctCount: cC,
        wrongCount: wC,
        elapsedTime: elapsed,
        settings: s,
        timestamp: Date.now(),
      };
      localStorage.setItem(getStorageKey(setInfo.id), JSON.stringify(data));
    },
    [setInfo.id]
  );

  // Debounce saver hook
  useEffect(() => {
    if (isFinished) return;
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    const handler = setTimeout(() => {
      saveSessionState(wordStates, recentConfigs, recentAskedIds, totalQuestions, correctCount, wrongCount, elapsedTime, settings);
    }, 1500);

    return () => clearTimeout(handler);
  }, [wordStates, recentConfigs, recentAskedIds, totalQuestions, correctCount, wrongCount, elapsedTime, settings, isFinished, saveSessionState, settingsKey]);

  // Priority queue selecting algorithm
  const selectNextWord = useCallback(
    (states: LearnWordState[]) => {
      const nextInfo = AdaptiveEngine.selectNextWord({
        states,
        recentAskedIds,
        orderRandom: settings.orderRandom,
        recentConfigs,
        settings,
      });

      if (!nextInfo) {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const key = getStorageKey(setInfo.id);
        localStorage.removeItem(key);
        return;
      }

      const question = QuestionGenerator.generate({
        word: nextInfo.selected.word,
        direction: nextInfo.direction,
        type: nextInfo.type,
        distractorPool: initialWords,
        recentAskedIds,
      });

      setCurrentQuestion(question);

      // Update configuration variety history
      setRecentConfigs((prev) => {
        const next = [{ direction: nextInfo.direction, type: nextInfo.type }, ...prev];
        if (next.length > 5) next.pop();
        return next;
      });

      // Update anti-repeat history tracker
      setRecentAskedIds((prev) => {
        const next = [...prev, question.id];
        if (next.length > 3) next.shift();
        return next;
      });

      // Clear input fields
      setInputValue("");
      setSelectedOptionId(null);
      setAnswerState("unanswered");
    },
    [recentAskedIds, settings, initialWords, recentConfigs, setInfo.id]
  );

  // Trigger loading next question on initial fetch or settings changes
  useEffect(() => {
    if (wordStates.length > 0 && !currentQuestion && !isFinished && !resumePromptOpen) {
      const handle = setTimeout(() => {
        selectNextWord(wordStates);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [wordStates, currentQuestion, isFinished, selectNextWord, resumePromptOpen]);

  // Autoplay speech trigger handlers (safe hook consumption)
  useEffect(() => {
    if (currentQuestion && currentQuestion.direction === "en-vi" && answerState === "unanswered") {
      triggerAutoplay(currentQuestion.id, currentQuestion.prompt, autoPlayQuestionAudio);
    }
  }, [currentQuestion, answerState, autoPlayQuestionAudio, triggerAutoplay]);

  useEffect(() => {
    if (currentQuestion && answerState !== "unanswered") {
      triggerAutoplay(currentQuestion.id + "-ex", currentQuestion.word.word, autoPlayExplanationAudio);
    }
  }, [currentQuestion, answerState, autoPlayExplanationAudio, triggerAutoplay]);

  // Check Answer evaluations
  const handleCheckAnswer = useCallback((answerText: string) => {
    if (!currentQuestion || answerState !== "unanswered") return;

    const result =
      currentQuestion.direction === "en-vi"
        ? checkVietnameseAnswer(answerText, currentQuestion.word.meaning, {
            synonyms: currentQuestion.word.synonyms ?? undefined,
          })
        : checkEnglishAnswer(answerText, currentQuestion.word.word);

    setAnswerState(result);
  }, [currentQuestion, answerState]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion || answerState !== "unanswered") return;
    setAnswerState("unknown");
  }, [currentQuestion, answerState]);

  const handleContinue = useCallback(() => {
    if (!currentQuestion) return;

    const isSuccessful = answerState === "correct" || answerState === "near";
    setTotalQuestions((prev) => prev + 1);

    if (isSuccessful) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    const updated = AdaptiveEngine.updateProgress({
      states: wordStates,
      wordId: currentQuestion.id,
      answerResult: answerState,
    });

    setWordStates(updated);
    setCurrentQuestion(null);

    void fetch("/api/srs/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: currentQuestion.id,
        mode: "learn",
        answerResult: isSuccessful ? "correct" : "wrong",
        reviewSessionId,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        console.error("SRS save failed (learn)", await response.text());
        return;
      }
      if (reviewSessionId) {
        const data = (await response.json()) as { completed?: boolean };
        if (data.completed) {
          router.replace(`/review/session/${reviewSessionId}/complete`);
        }
      }
    }).catch((error) => {
      console.error("SRS save request failed (learn)", error);
    });

    // Immediate save trigger
    saveSessionState(updated, recentConfigs, recentAskedIds, totalQuestions + 1, correctCount + (isSuccessful ? 1 : 0), wrongCount + (isSuccessful ? 0 : 1), elapsedTime, settings);
  }, [
    currentQuestion,
    answerState,
    wordStates,
    recentConfigs,
    recentAskedIds,
    totalQuestions,
    correctCount,
    wrongCount,
    elapsedTime,
    settings,
    saveSessionState,
    reviewSessionId,
    router,
  ]);

  // Re-run session initialization
  const handleRestart = () => {
    setWordStates(AdaptiveEngine.initializeStates(initialWords));
    setCurrentQuestion(null);
    setIsFinished(false);
    setTotalQuestions(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedTime(0);
    setRecentConfigs([]);
    setRecentAskedIds([]);
    startedAt.current = Date.now();
    localStorage.removeItem(getStorageKey(setInfo.id));
  };

  // Setup Hotkey keys mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");

      const isSubmitted = answerState !== "unanswered";

      // Handle skip keyboard triggers Ctrl + I
      if (!isSubmitted && e.ctrlKey && e.code === "KeyI") {
        e.preventDefault();
        handleSkip();
        return;
      }

      // Handle continue
      if (isSubmitted && e.code === "Enter") {
        if (!settings.autoContinue) {
          e.preventDefault();
          handleContinue();
        }
        return;
      }

      if (isInput) return;

      // Handle MCQ selection keys (1,2,3,4) dynamically based on options availability
      if (currentQuestion && currentQuestion.type === "mcq" && currentQuestion.options && !isSubmitted && !settingsOpened) {
        if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
          e.preventDefault();
          const idx = parseInt(e.code.replace("Digit", "")) - 1;
          if (idx < currentQuestion.options.length) {
            const opt = currentQuestion.options[idx];
            setSelectedOptionId(opt.id);
            handleCheckAnswer(opt.text);
          }
        }
      }

      if (e.code === "Escape") {
        e.preventDefault();
        setExitPromptOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerState, currentQuestion, settingsOpened, settings.autoContinue, onBack, handleCheckAnswer, handleContinue, handleSkip]);

  // Format Timer strings helper
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} giây`;
    return `${minutes} phút ${secs} giây`;
  };

  usePreserveScrollPosition(currentQuestion?.id ?? (isFinished ? "finished" : "ready"));

  // Empty state layouts
  if (initialWords.length === 0) {
    return (
      <EmptyFlashcard
        onBack={onBack}
        onAddWords={() => router.push(`/vocabulary/${setInfo.id}/edit`)}
      />
    );
  }

  // Finished stats summaries
  if (isFinished) {
    const totalDone = correctCount + wrongCount;
    const accuracyValue = totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 0;
    return (
      <StudySummary
        totalWords={initialWords.length}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        wrongCount={wrongCount}
        accuracy={accuracyValue}
        timeString={formatTime(elapsedTime)}
        onRestart={handleRestart}
        onBackToSet={onBack}
      />
    );
  }

  // Active indices statistics counts
  const masteredCount = wordStates.filter((s) => s.status === "mastered").length;
  const learningCount = wordStates.filter((s) => s.status === "learning" && (s.correctStreak > 0 || s.wrongCount > 0)).length;
  const remainingCount = initialWords.length - masteredCount - learningCount;
  const totalDone = correctCount + wrongCount;
  const accuracyValue = totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 100;

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header bar actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExitPromptOpen(true)}
            className="h-9 w-9 rounded-xl hover:bg-muted/80 cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground truncate max-w-sm sm:max-w-md">
              {setInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Học tập thích ứng (Learn)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 shrink-0 bg-muted/30 px-3 py-1.5 rounded-xl border">
            <span>Thời gian: {formatTime(elapsedTime)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpened(true)}
            className="h-9 w-9 rounded-xl cursor-pointer hover:bg-muted/80 shrink-0"
            title="Cấu hình thiết lập"
          >
            <Settings className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Main Study components triggers */}
      <div className="py-2 space-y-6">
        {currentQuestion && (
          <>
            {currentQuestion.type === "mcq" ? (
              <LearnMCQ
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                answerState={answerState}
                onSelectOption={(optionId) => {
                  setSelectedOptionId(optionId);
                  const opt = currentQuestion.options.find((o) => o.id === optionId);
                  if (opt) {
                    handleCheckAnswer(opt.text);
                  }
                }}
                onSkip={handleSkip}
                autoPlayQuestionAudio={autoPlayQuestionAudio}
                onToggleAutoPlayQuestion={() => setAutoPlayQuestionAudio((prev) => !prev)}
                onSpeakPrompt={() => speakText(currentQuestion.prompt)}
              />
            ) : (
              <LearnInput
                question={currentQuestion}
                inputValue={inputValue}
                answerState={answerState}
                onInputChange={setInputValue}
                onSubmit={() => handleCheckAnswer(inputValue)}
                onContinue={handleContinue}
                onSkip={handleSkip}
                autoPlayQuestionAudio={autoPlayQuestionAudio}
                onToggleAutoPlayQuestion={() => setAutoPlayQuestionAudio((prev) => !prev)}
                onSpeakPrompt={() => speakText(currentQuestion.prompt)}
              />
            )}

            {answerState !== "unanswered" && (
              <StudyExplanation
                word={currentQuestion.word}
                answerState={answerState}
                onContinue={handleContinue}
                autoContinue={settings.autoContinue}
                autoPlayExplanationAudio={autoPlayExplanationAudio}
                onToggleAutoPlayExplanation={() => setAutoPlayExplanationAudio((prev) => !prev)}
                onSpeakWord={() => speakText(currentQuestion.word.word)}
              />
            )}
          </>
        )}
      </div>

      {/* Progress meter status details */}
      <StudyProgress
        totalWords={initialWords.length}
        masteredCount={masteredCount}
        learningCount={learningCount}
        remainingCount={remainingCount}
        accuracy={accuracyValue}
      />

      {/* Learn Configuration Overlay Modal */}
      <LearnSettingsDialog
        open={settingsOpened}
        onOpenChange={setSettingsOpened}
        settings={settings}
        onSaveSettings={(nextSettings) => {
          setSettings(nextSettings);
          localStorage.setItem(settingsKey, JSON.stringify(nextSettings));
          // Restart queue logic after configurations change to enforce random/original structures
          const list = [...wordStates];
          if (nextSettings.orderRandom) {
            list.sort(() => Math.random() - 0.5);
          }
          setWordStates(list);
          setCurrentQuestion(null);
          // Save instantly
          saveSessionState(list, recentConfigs, recentAskedIds, totalQuestions, correctCount, wrongCount, elapsedTime, nextSettings);
        }}
      />

      {/* Persistence Restore Dialog */}
      <Dialog open={resumePromptOpen} onOpenChange={setResumePromptOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Khôi phục tiến trình học?</DialogTitle>
            <DialogDescription>
              Chúng tôi tìm thấy tiến trình chưa hoàn thành của bạn từ buổi trước. Bạn muốn tiếp tục hay bắt đầu lại?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResumePromptOpen(false);
                handleRestart();
              }}
            >
              Bắt đầu lại
            </Button>
            <Button
              onClick={() => {
                if (pendingSessionData) {
                  setWordStates(pendingSessionData.wordStates);
                  setRecentAskedIds(pendingSessionData.recentAskedIds || []);
                  setRecentConfigs(pendingSessionData.recentConfigs || []);
                  setTotalQuestions(pendingSessionData.totalQuestions || 0);
                  setCorrectCount(pendingSessionData.correctCount || 0);
                  setWrongCount(pendingSessionData.wrongCount || 0);
                  setElapsedTime(pendingSessionData.elapsedTime || 0);
                  setSettings(pendingSessionData.settings);
                }
                setResumePromptOpen(false);
              }}
            >
              Tiếp tục học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={exitPromptOpen} onOpenChange={setExitPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thoát chế độ học?</DialogTitle>
            <DialogDescription>
              Tiến trình học của bạn đã được tự động lưu. Bạn có thể quay lại tiếp tục bất kỳ lúc nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitPromptOpen(false)}>
              Ở lại học tiếp
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setExitPromptOpen(false);
                onBack();
              }}
            >
              Thoát
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
