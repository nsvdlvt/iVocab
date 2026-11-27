"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PersonalTestRecord,
  PersonalTestAttemptRecord,
  PersonalTestFlashcardItem,
  PersonalTestLearnWordPromotion,
  PersonalTestStage,
  FlashcardAssessmentStatus,
  TestMode,
  OverallGradingResult,
} from "@/types/vocabee-test";
import { TestProgress } from "./TestProgress";
import { ExerciseRenderer } from "./ExerciseRenderer";
import { PersonalTestFlashcards } from "./PersonalTestFlashcards";
import { TestResult } from "./TestResult";
import { LearnViewer } from "@/components/features/learn/LearnViewer";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  saveAttemptProgressAction,
  submitAttemptAction,
  startOrResumeAttemptAction,
} from "@/actions/personal-test";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  LogOut,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getQuestionKey } from "@/lib/personal-test/vocabee-test-grader";
import {
  type PerSetFlashcardState,
  type PersistedPersonalTestSessionState,
  areAllSetsLearnCompleted,
  buildTemporaryLearnWordsForSet,
  canUnlockPersonalTestSet,
  createDefaultPerSetFlashcardState,
  getFlashcardsForSet,
  getPersonalTestFlashcardsStorageKey,
  getPersonalTestSessionStorageKey,
  isExerciseFullyAnswered,
} from "@/lib/personal-test/flashcard-session";

interface TestSessionViewProps {
  test: PersonalTestRecord;
  initialAttempt: PersonalTestAttemptRecord;
  initialFlashcards?: PersonalTestFlashcardItem[];
  initialGrading?: OverallGradingResult | null;
}

function shuffleFlashcardIds(cards: PersonalTestFlashcardItem[]): string[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids;
}

function setHasAnySavedAnswer(
  test: PersonalTestRecord,
  setIndex: number,
  answers: Record<string, string>
): boolean {
  const prefix = `s${setIndex}_`;
  return Object.entries(answers).some(
    ([key, val]) => key.startsWith(prefix) && Boolean(val?.trim())
  );
}

export function TestSessionView({
  test,
  initialAttempt,
  initialFlashcards = [],
  initialGrading = null,
}: TestSessionViewProps) {
  const router = useRouter();

  const [attempt, setAttempt] = useState<PersonalTestAttemptRecord>(initialAttempt);
  const [flashcards, setFlashcards] = useState<PersonalTestFlashcardItem[]>(initialFlashcards);

  const [stage, setStage] = useState<PersonalTestStage>("flashcards");
  const [flashcardBySet, setFlashcardBySet] = useState<Record<number, PerSetFlashcardState>>({});
  const [assessments, setAssessments] = useState<Record<string, FlashcardAssessmentStatus>>({});
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const [currentSetIndex, setCurrentSetIndex] = useState(initialAttempt.current_set_index || 0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    initialAttempt.current_exercise_index || 0
  );
  const [mode, setMode] = useState<TestMode>(initialAttempt.mode || "practice");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAttempt.answers || {});

  // Practice mode checked state per exercise key: `s{setIndex}_e{exerciseIndex}`
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [learnCompletedBySet, setLearnCompletedBySet] = useState<Record<number, boolean>>({});
  const [learnResultsBySet, setLearnResultsBySet] = useState<
    Record<number, PersonalTestLearnWordPromotion[]>
  >({});
  const [showCompletedLearnSummary, setShowCompletedLearnSummary] = useState(false);
  const [isPromotingLearn, setIsPromotingLearn] = useState(false);
  const [hasHydratedSession, setHasHydratedSession] = useState(false);

  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedGrading, setCompletedGrading] = useState<OverallGradingResult | null>(
    initialGrading
  );
  const [progressOffsetPx, setProgressOffsetPx] = useState(118);
  const sessionRootRef = useRef<HTMLDivElement>(null);

  // Hydrate exact selected flashcards (if created in this browser) and unified session state
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedFlashcardsRaw = window.sessionStorage.getItem(
          getPersonalTestFlashcardsStorageKey(test.id)
        );
        if (storedFlashcardsRaw) {
          const parsedCards = JSON.parse(storedFlashcardsRaw) as PersonalTestFlashcardItem[];
          if (Array.isArray(parsedCards) && parsedCards.length > 0) {
            setFlashcards(parsedCards);
          }
        }
      } catch {
        // Ignore storage errors
      }

      try {
        const sessionRaw = window.sessionStorage.getItem(
          getPersonalTestSessionStorageKey(test.id, attempt.id)
        );
        if (sessionRaw) {
          const saved = JSON.parse(sessionRaw) as Partial<PersistedPersonalTestSessionState>;
          if (
            saved.stage === "flashcards" ||
            saved.stage === "exercise" ||
            saved.stage === "learn"
          ) {
            setStage(saved.stage);
          }
          if (saved.flashcardBySet && typeof saved.flashcardBySet === "object") {
            setFlashcardBySet(saved.flashcardBySet);
          }
          if (saved.assessments && typeof saved.assessments === "object") {
            setAssessments(saved.assessments);
          }
          if (Array.isArray(saved.reviewedIds)) {
            setReviewedIds(saved.reviewedIds);
          }
          if (saved.checkedMap && typeof saved.checkedMap === "object") {
            setCheckedMap(saved.checkedMap);
          }
          if (saved.learnCompletedBySet && typeof saved.learnCompletedBySet === "object") {
            setLearnCompletedBySet(saved.learnCompletedBySet);
            const activeSet = initialAttempt.current_set_index || 0;
            if (saved.stage === "learn" && saved.learnCompletedBySet[activeSet]) {
              setShowCompletedLearnSummary(true);
            }
          }
          if (saved.learnResultsBySet && typeof saved.learnResultsBySet === "object") {
            setLearnResultsBySet(saved.learnResultsBySet);
          }
        } else {
          // Fresh load without local sessionStorage: if DB attempt already has saved answers/progress
          // on current set, resume in exercise stage while keeping Flashcards accessible in header.
          const dbSetIdx = initialAttempt.current_set_index || 0;
          const hasExistingDbExerciseProgress =
            setHasAnySavedAnswer(test, dbSetIdx, initialAttempt.answers || {}) ||
            (initialAttempt.current_exercise_index || 0) > 0;
          if (hasExistingDbExerciseProgress) {
            setStage("exercise");
            setFlashcardBySet({
              [dbSetIdx]: {
                ...createDefaultPerSetFlashcardState(),
                completed: true,
              },
            });
          } else {
            setStage("flashcards");
          }
        }
      } catch {
        // Ignore storage errors
      } finally {
        setHasHydratedSession(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [test, attempt.id, initialAttempt]);

  // Persist unified session state to sessionStorage on any change
  useEffect(() => {
    if (!hasHydratedSession) return;
    try {
      const payload: PersistedPersonalTestSessionState = {
        stage,
        flashcardBySet,
        assessments,
        reviewedIds,
        checkedMap,
        learnCompletedBySet,
        learnResultsBySet,
      };
      window.sessionStorage.setItem(
        getPersonalTestSessionStorageKey(test.id, attempt.id),
        JSON.stringify(payload)
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    hasHydratedSession,
    test.id,
    attempt.id,
    stage,
    flashcardBySet,
    assessments,
    reviewedIds,
    checkedMap,
    learnCompletedBySet,
    learnResultsBySet,
  ]);

  const currentSet = test.content.sets[currentSetIndex] || test.content.sets[0];
  const currentExercise = currentSet.exercises[currentExerciseIndex];
  const currentExerciseKey = `s${currentSetIndex}_e${currentExerciseIndex}`;
  const isCurrentChecked = !!checkedMap[currentExerciseKey];

  // Flashcards scoped strictly to the current Set (up to ~15 words)
  const currentSetFlashcards = useMemo(
    () => getFlashcardsForSet(flashcards, currentSet.words),
    [flashcards, currentSet.words]
  );

  const allTestLearnWords = useMemo(
    () => buildTemporaryLearnWordsForSet(flashcards),
    [flashcards]
  );

  const currentSetLearnWords = useMemo(
    () => buildTemporaryLearnWordsForSet(currentSetFlashcards),
    [currentSetFlashcards]
  );

  const isLastSet = currentSetIndex === test.content.sets.length - 1;
  const isCurrentSetLearnCompleted = Boolean(learnCompletedBySet[currentSetIndex]);

  const allSetsLearnCompleted = useMemo(
    () =>
      areAllSetsLearnCompleted(
        test.content.sets.length,
        learnCompletedBySet,
        (setIdx) => getFlashcardsForSet(flashcards, test.content.sets[setIdx]?.words ?? []).length > 0
      ),
    [test.content.sets, learnCompletedBySet, flashcards]
  );

  const isSetUnlocked = useCallback(
    (setIdx: number) => canUnlockPersonalTestSet(setIdx, learnCompletedBySet, answers),
    [learnCompletedBySet, answers]
  );

  const currentFlashcardState = useMemo(
    () => flashcardBySet[currentSetIndex] ?? createDefaultPerSetFlashcardState(),
    [flashcardBySet, currentSetIndex]
  );

  const updateCurrentSetFlashcardState = useCallback(
    (updater: (prev: PerSetFlashcardState) => PerSetFlashcardState) => {
      setFlashcardBySet((prev) => {
        const existing = prev[currentSetIndex] ?? createDefaultPerSetFlashcardState();
        return {
          ...prev,
          [currentSetIndex]: updater(existing),
        };
      });
    },
    [currentSetIndex]
  );

  // Completed exercises in current set
  const completedExerciseIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < currentSet.exercises.length; i += 1) {
      if (isExerciseFullyAnswered(test.content, currentSetIndex, i, answers)) {
        indices.push(i);
      }
    }
    return indices;
  }, [test.content, currentSet.exercises.length, currentSetIndex, answers]);

  // Overall progress across sets (each set = 1 Flashcards + 4 exercises + 1 Learn = 6 stages)
  const totalStagesWeight = test.content.sets.length * 6;
  const overallProgress =
    stage === "flashcards"
      ? Math.round(
          ((currentSetIndex * 6 +
            (currentSetFlashcards.length > 0
              ? (currentFlashcardState.index + 1) / currentSetFlashcards.length
              : 1)) /
            totalStagesWeight) *
            100
        )
      : stage === "learn"
      ? Math.round(((currentSetIndex * 6 + (isCurrentSetLearnCompleted ? 6 : 5.5)) / totalStagesWeight) * 100)
      : Math.round(
          ((currentSetIndex * 6 + 1 + currentExerciseIndex + 1) / totalStagesWeight) * 100
        );

  const currentExerciseQuestionCount =
    currentExercise.type === "cloze_test"
      ? currentExercise.answers.length
      : currentExercise.items.length;

  const answeredInCurrentExercise =
    currentExercise.type === "cloze_test"
      ? currentExercise.answers.filter((a) => {
          const key = getQuestionKey(currentSetIndex, currentExerciseIndex, "cloze_test", a.id);
          return !!answers[key]?.trim();
        }).length
      : currentExercise.items.filter((item) => {
          const key = getQuestionKey(
            currentSetIndex,
            currentExerciseIndex,
            currentExercise.type,
            item.id
          );
          return !!answers[key]?.trim();
        }).length;

  const isCurrentExerciseFullyAnswered =
    answeredInCurrentExercise === currentExerciseQuestionCount;

  const answeredTotalCount = Object.values(answers).filter((v) => !!v?.trim()).length;

  let testTotalQuestions = 0;
  test.content.sets.forEach((s) => {
    s.exercises.forEach((ex) => {
      testTotalQuestions += ex.type === "cloze_test" ? ex.answers.length : ex.items.length;
    });
  });

  const isLastExercise =
    currentSetIndex === test.content.sets.length - 1 && currentExerciseIndex === 3;

  // Debounced auto-save checkpoint + immediate flush helper
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushProgress = useCallback(
    async (newAnswers: Record<string, string>, sIdx: number, eIdx: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      try {
        await saveAttemptProgressAction(attempt.id, {
          answers: newAnswers,
          currentSetIndex: sIdx,
          currentExerciseIndex: eIdx,
        });
      } catch (e) {
        console.error("Failed to save attempt progress:", e);
      }
    },
    [attempt.id]
  );

  const saveProgress = useCallback(
    (newAnswers: Record<string, string>, sIdx: number, eIdx: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void flushProgress(newAnswers, sIdx, eIdx);
      }, 600);
    },
    [flushProgress]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const scrollToTop = () => {
    const scrollHost = sessionRootRef.current?.closest("main");
    if (scrollHost) {
      scrollHost.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAnswerChange = (questionKey: string, value: string) => {
    const updated = { ...answers, [questionKey]: value };
    setAnswers(updated);
    saveProgress(updated, currentSetIndex, currentExerciseIndex);
  };

  const handleCheckCurrentExercise = () => {
    if (!isCurrentExerciseFullyAnswered) {
      toast.warning("Vui lòng hoàn thành tất cả các câu trong bài tập này trước khi kiểm tra!");
      return;
    }
    setCheckedMap((prev) => ({ ...prev, [currentExerciseKey]: true }));
    void flushProgress(answers, currentSetIndex, currentExerciseIndex);
    toast.success("Đã chấm điểm! Xem giải thích chi tiết phía dưới.");
  };

  const handleNavigateToExercise = (nextSetIdx: number, nextExIdx: number) => {
    setShowCompletedLearnSummary(false);
    setStage("exercise");
    setFlashcardBySet((prev) => {
      const existing = prev[nextSetIdx] ?? createDefaultPerSetFlashcardState();
      return {
        ...prev,
        [nextSetIdx]: { ...existing, completed: true, showCompletion: false },
      };
    });
    setCurrentSetIndex(nextSetIdx);
    setCurrentExerciseIndex(nextExIdx);
    void flushProgress(answers, nextSetIdx, nextExIdx);
    scrollToTop();
  };

  const handleSelectSet = (nextSetIdx: number, forceOpenFlashcards = false) => {
    if (!isSetUnlocked(nextSetIdx)) {
      toast.info(`Hoàn thành bài Learn của Set ${nextSetIdx} trước để mở khóa Set ${nextSetIdx + 1}.`);
      return;
    }

    setShowCompletedLearnSummary(false);
    const targetSetFlashcardState = flashcardBySet[nextSetIdx];
    const hasStartedSetExercises =
      !forceOpenFlashcards &&
      (Boolean(targetSetFlashcardState?.completed) ||
        setHasAnySavedAnswer(test, nextSetIdx, answers));

    if (hasStartedSetExercises) {
      handleNavigateToExercise(nextSetIdx, 0);
      return;
    }

    setCurrentSetIndex(nextSetIdx);
    setCurrentExerciseIndex(0);
    setStage("flashcards");
    void flushProgress(answers, nextSetIdx, 0);
    scrollToTop();
  };

  const handleSelectFlashcardsStage = () => {
    setShowCompletedLearnSummary(false);
    setStage("flashcards");
    updateCurrentSetFlashcardState((prev) => ({ ...prev, showCompletion: false }));
    scrollToTop();
  };

  const handleSelectLearnStage = () => {
    setShowCompletedLearnSummary(Boolean(learnCompletedBySet[currentSetIndex]));
    setStage("learn");
    scrollToTop();
  };

  const handleCompleteSetLearn = useCallback(async () => {
    if (learnCompletedBySet[currentSetIndex]) {
      return;
    }

    setIsPromotingLearn(true);
    try {
      const vocabularyIds = Array.from(
        new Set(currentSetFlashcards.flatMap((card) => card.sourceVocabularyIds))
      );

      const res = await fetch(`/api/personal-test/${test.id}/learn-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setIndex: currentSetIndex,
          vocabularyIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể cập nhật level từ vựng.");
      }

      const promotedWords = (data.data?.promotedWords ??
        []) as PersonalTestLearnWordPromotion[];
      setLearnCompletedBySet((prev) => ({ ...prev, [currentSetIndex]: true }));
      setLearnResultsBySet((prev) => ({ ...prev, [currentSetIndex]: promotedWords }));

      const upgradedCount = promotedWords.filter((w) => w.gainedLevel).length;
      toast.success(
        upgradedCount > 0
          ? `Đã hoàn thành Learn ${currentSet.label} và nâng cấp ${upgradedCount} từ vựng!`
          : `Đã hoàn thành bài Learn cho ${currentSet.label}!`
      );
    } catch (err) {
      console.error("Failed to promote vocabulary levels after learn:", err);
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi cập nhật level từ vựng."
      );
      setLearnCompletedBySet((prev) => ({ ...prev, [currentSetIndex]: true }));
    } finally {
      setIsPromotingLearn(false);
    }
  }, [currentSet.label, currentSetFlashcards, currentSetIndex, learnCompletedBySet, test.id]);

  const handleProceedAfterSetLearn = (completedSetIdx: number) => {
    setShowCompletedLearnSummary(false);
    if (completedSetIdx < test.content.sets.length - 1) {
      handleSelectSet(completedSetIdx + 1, true);
    }
  };

  const handleStartTestFromFlashcards = () => {
    updateCurrentSetFlashcardState((prev) => ({
      ...prev,
      completed: true,
      showCompletion: false,
    }));
    setShowCompletedLearnSummary(false);
    setStage("exercise");
    void flushProgress(answers, currentSetIndex, currentExerciseIndex);
    scrollToTop();
  };

  const handleNext = () => {
    if (currentExerciseIndex < 3) {
      handleNavigateToExercise(currentSetIndex, currentExerciseIndex + 1);
      return;
    }

    // End of current Set (Cloze exercise): transition into temporary /learn stage
    if (currentSetLearnWords.length > 0 && (!isCurrentSetLearnCompleted || isLastSet)) {
      handleSelectLearnStage();
      return;
    }

    if (currentSetLearnWords.length === 0) {
      setLearnCompletedBySet((prev) => ({ ...prev, [currentSetIndex]: true }));
    }

    if (currentSetIndex < test.content.sets.length - 1) {
      handleSelectSet(currentSetIndex + 1, true);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex === 0) {
      handleSelectFlashcardsStage();
      return;
    }
    handleNavigateToExercise(currentSetIndex, currentExerciseIndex - 1);
  };

  // Active deck inside current Set for review tracking
  const activeDeckForReviewTracking = useMemo(() => {
    const shuffled = currentFlashcardState.shuffledIds;
    const ordered =
      shuffled && shuffled.length > 0
        ? [
            ...shuffled
              .map((id) => currentSetFlashcards.find((c) => c.id === id))
              .filter((c): c is PersonalTestFlashcardItem => Boolean(c)),
            ...currentSetFlashcards.filter((c) => !shuffled.includes(c.id)),
          ]
        : currentSetFlashcards;

    return currentFlashcardState.filter === "not_remembered"
      ? ordered.filter((c) => assessments[c.id] === "not_remembered")
      : ordered;
  }, [
    currentSetFlashcards,
    currentFlashcardState.shuffledIds,
    currentFlashcardState.filter,
    assessments,
  ]);

  const markCardReviewed = useCallback((cardId: string | undefined) => {
    if (!cardId) return;
    setReviewedIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  }, []);

  const handleFlashcardFlippedChange = (nextFlipped: boolean) => {
    updateCurrentSetFlashcardState((prev) => ({ ...prev, flipped: nextFlipped }));
    if (nextFlipped) {
      const card = activeDeckForReviewTracking[currentFlashcardState.index];
      markCardReviewed(card?.id);
    }
  };

  const handleFlashcardIndexChange = (nextIndex: number) => {
    const currentCard = activeDeckForReviewTracking[currentFlashcardState.index];
    markCardReviewed(currentCard?.id);
    updateCurrentSetFlashcardState((prev) => ({ ...prev, index: nextIndex }));
  };

  const handleFlashcardShowCompletionChange = (show: boolean) => {
    if (show) {
      const currentCard = activeDeckForReviewTracking[currentFlashcardState.index];
      markCardReviewed(currentCard?.id);
    }
    updateCurrentSetFlashcardState((prev) => ({ ...prev, showCompletion: show }));
  };

  const handleToggleShuffle = () => {
    updateCurrentSetFlashcardState((prev) => ({
      ...prev,
      shuffledIds: prev.shuffledIds ? null : shuffleFlashcardIds(currentSetFlashcards),
      index: 0,
      flipped: false,
    }));
  };

  const handleAssessFlashcard = (
    cardId: string,
    status: FlashcardAssessmentStatus | null
  ) => {
    markCardReviewed(cardId);
    setAssessments((prev) => {
      const next = { ...prev };
      if (status === null) {
        delete next[cardId];
      } else {
        next[cardId] = status;
      }
      return next;
    });
    if (currentFlashcardState.filter === "not_remembered" && status !== "not_remembered") {
      updateCurrentSetFlashcardState((prev) => ({ ...prev, flipped: false }));
    }
  };

  const handleRestartFlashcards = () => {
    updateCurrentSetFlashcardState((prev) => ({
      ...prev,
      filter: "all",
      index: 0,
      flipped: false,
      showCompletion: false,
    }));
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitAttemptAction(attempt.id, answers);
      if (res.success) {
        try {
          window.sessionStorage.removeItem(
            getPersonalTestSessionStorageKey(test.id, attempt.id)
          );
        } catch {
          // Ignore storage errors
        }
        toast.success("Nộp bài thi thành công!");
        setCompletedGrading(res.grading);
        router.push(`/u/personal-test/${test.id}/result/${res.attemptId}`);
      } else {
        toast.error(res.error || "Không thể nộp bài. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi nộp bài thi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    try {
      const oldAttemptId = attempt.id;
      const res = await startOrResumeAttemptAction(test.id, mode);
      if (res.success) {
        try {
          window.sessionStorage.removeItem(
            getPersonalTestSessionStorageKey(test.id, oldAttemptId)
          );
        } catch {
          // Ignore storage errors
        }
        setAttempt(res.attempt);
        setAnswers({});
        setCheckedMap({});
        setCurrentSetIndex(0);
        setCurrentExerciseIndex(0);
        setStage("flashcards");
        setFlashcardBySet({});
        setAssessments({});
        setReviewedIds([]);
        setLearnCompletedBySet({});
        setLearnResultsBySet({});
        setShowCompletedLearnSummary(false);
        setCompletedGrading(null);
        router.push(`/u/personal-test/${test.id}`);
        toast.success("Bắt đầu bài thi mới!");
      }
    } catch {
      toast.error("Lỗi khi tạo lượt thi mới");
    }
  };

  if (completedGrading) {
    return (
      <TestResult
        test={test}
        attempt={attempt}
        grading={completedGrading}
        onRetry={handleRetry}
      />
    );
  }

  const currentSetReviewedCount = currentSetFlashcards.filter(
    (c) => reviewedIds.includes(c.id) || Boolean(assessments[c.id])
  ).length;

  return (
    <div
      ref={sessionRootRef}
      className="flex flex-col min-h-screen bg-background"
      style={{ "--test-progress-offset": `${progressOffsetPx}px` } as React.CSSProperties}
    >
      {/* Test Progress & 6-Stage Sticky Header */}
      <TestProgress
        testTitle={test.title}
        totalSets={test.total_sets}
        currentSetIndex={currentSetIndex}
        currentSetLabel={currentSet.label}
        stage={stage}
        isResultsStage={false}
        flashcardsCompleted={currentFlashcardState.completed}
        completedExerciseIndices={completedExerciseIndices}
        currentExerciseIndex={currentExerciseIndex}
        overallProgress={overallProgress}
        mode={mode}
        onModeToggle={(m) => setMode(m)}
        onSelectFlashcards={handleSelectFlashcardsStage}
        onSelectExercise={(exIdx) => handleNavigateToExercise(currentSetIndex, exIdx)}
        onSelectLearn={handleSelectLearnStage}
        onSelectSet={(sIdx) => handleSelectSet(sIdx)}
        learnCompleted={isCurrentSetLearnCompleted}
        learnCompletedBySet={learnCompletedBySet}
        isSetUnlocked={isSetUnlocked}
        onExit={() => setIsExitDialogOpen(true)}
        answeredCount={answeredTotalCount}
        totalQuestions={testTotalQuestions}
        flashcardReviewedCount={currentSetReviewedCount}
        flashcardTotalCount={currentSetFlashcards.length}
        onHeightChange={setProgressOffsetPx}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {stage === "flashcards" ? (
          <PersonalTestFlashcards
            cards={currentSetFlashcards}
            setLabel={test.total_sets > 1 ? currentSet.label : undefined}
            currentIndex={currentFlashcardState.index}
            flipped={currentFlashcardState.flipped}
            filter={currentFlashcardState.filter}
            showCompletion={currentFlashcardState.showCompletion}
            shuffledIds={currentFlashcardState.shuffledIds}
            assessments={assessments}
            reviewedIds={reviewedIds}
            hasStartedExercises={
              currentFlashcardState.completed ||
              setHasAnySavedAnswer(test, currentSetIndex, answers)
            }
            onIndexChange={handleFlashcardIndexChange}
            onFlippedChange={handleFlashcardFlippedChange}
            onFilterChange={(nextFilter) =>
              updateCurrentSetFlashcardState((prev) => ({
                ...prev,
                filter: nextFilter,
              }))
            }
            onShowCompletionChange={handleFlashcardShowCompletionChange}
            onToggleShuffle={handleToggleShuffle}
            onAssess={handleAssessFlashcard}
            onRestart={handleRestartFlashcards}
            onStartTest={handleStartTestFromFlashcards}
          />
        ) : stage === "learn" ? (
          currentSetLearnWords.length === 0 ? (
            <SectionCard className="max-w-xl mx-auto p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Không có từ vựng nào cần kiểm tra trong {currentSet.label}.
              </p>
              <Button
                type="button"
                onClick={() => {
                  setLearnCompletedBySet((prev) => ({ ...prev, [currentSetIndex]: true }));
                  if (isLastSet) {
                    void handleSubmitTest();
                  } else {
                    handleProceedAfterSetLearn(currentSetIndex);
                  }
                }}
                className="cursor-pointer gap-2"
              >
                <span>{isLastSet ? "Hoàn thành & Nộp bài" : `Sang Set ${currentSetIndex + 2}`}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </SectionCard>
          ) : showCompletedLearnSummary && isCurrentSetLearnCompleted ? (
            <SectionCard className="max-w-xl mx-auto p-6 sm:p-8 space-y-5 border-border/80 rounded-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đã hoàn thành chế độ /learn</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Kiểm tra từ vựng — {currentSet.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Level từ vựng của bộ tạm thời này đã được cập nhật cho vòng thi hiện tại.
                  </p>
                </div>
              </div>

              {(learnResultsBySet[currentSetIndex]?.length ?? 0) > 0 && (
                <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3.5 max-h-60 overflow-y-auto">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Cập nhật level từ vựng</span>
                  </p>
                  <div className="divide-y divide-border/50">
                    {learnResultsBySet[currentSetIndex]!.map((item) => (
                      <div
                        key={item.vocabularyId}
                        className="flex items-center justify-between gap-2 py-1.5 text-xs"
                      >
                        <span className="font-semibold text-foreground">{item.word}</span>
                        <Badge
                          variant="outline"
                          className="text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"
                        >
                          <span>Lv{item.previousLevel}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>Lv{item.nextLevel}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCompletedLearnSummary(false)}
                  className="cursor-pointer flex-1 gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Ôn lại vòng /learn</span>
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isLastSet) {
                      void handleSubmitTest();
                    } else {
                      handleProceedAfterSetLearn(currentSetIndex);
                    }
                  }}
                  className="cursor-pointer flex-1 gap-1.5 font-semibold"
                >
                  {isLastSet ? <Send className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  <span>
                    {isLastSet
                      ? isSubmitting
                        ? "Đang chấm điểm..."
                        : "Hoàn thành & Nộp bài"
                      : `Sang Set ${currentSetIndex + 2}`}
                  </span>
                </Button>
              </div>
            </SectionCard>
          ) : (
            <LearnViewer
              key={`learn-${test.id}-${attempt.id}-set-${currentSetIndex}`}
              initialWords={currentSetLearnWords}
              distractorPool={allTestLearnWords}
              setInfo={{
                id: `personal_test_${test.id}_${attempt.id}_set_${currentSetIndex}`,
                title: `Kiểm tra từ vựng — ${currentSet.label}`,
              }}
              subtitle={`Bộ tạm thời (${currentSetLearnWords.length} từ) • Chế độ /learn`}
              summaryTitle={`Hoàn thành kiểm tra ${currentSet.label}!`}
              disablePerAnswerSrsSave={true}
              skipExitConfirm={true}
              hideRestartOnSummary={isCurrentSetLearnCompleted}
              primaryActionLabel={
                isLastSet
                  ? isSubmitting
                    ? "Đang chấm điểm..."
                    : "Hoàn thành & Nộp bài"
                  : `Sang Set ${currentSetIndex + 2}`
              }
              summaryPrimaryDisabled={isPromotingLearn || isSubmitting}
              summaryExtraContent={
                (learnResultsBySet[currentSetIndex]?.length ?? 0) > 0 ? (
                  <div className="mt-3 text-left space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3.5 max-h-52 overflow-y-auto">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Level từ vựng đã cập nhật</span>
                    </p>
                    <div className="divide-y divide-border/50">
                      {learnResultsBySet[currentSetIndex]!.map((item) => (
                        <div
                          key={item.vocabularyId}
                          className="flex items-center justify-between gap-2 py-1.5 text-xs"
                        >
                          <span className="font-semibold text-foreground">{item.word}</span>
                          <Badge
                            variant="outline"
                            className="text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"
                          >
                            <span>Lv{item.previousLevel}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>Lv{item.nextLevel}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              }
              onBack={() => handleNavigateToExercise(currentSetIndex, 3)}
              onRoundComplete={handleCompleteSetLearn}
              onPrimaryAction={() => {
                if (isLastSet) {
                  void handleSubmitTest();
                } else {
                  handleProceedAfterSetLearn(currentSetIndex);
                }
              }}
            />
          )
        ) : (
          <ExerciseRenderer
            exercise={currentExercise}
            setIndex={currentSetIndex}
            exerciseIndex={currentExerciseIndex}
            userAnswers={answers}
            onAnswerChange={handleAnswerChange}
            mode={mode}
            isChecked={mode === "practice" && isCurrentChecked}
          />
        )}
      </main>

      {/* Sticky Bottom Navigation Footer (Exercises stage) */}
      {stage === "exercise" && (
        <footer className="sticky bottom-0 z-20 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Previous button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="cursor-pointer gap-1.5 text-xs h-9"
            >
              {currentExerciseIndex === 0 ? (
                <>
                  <Layers className="h-4 w-4" />
                  <span>Về Flashcards</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Câu trước</span>
                </>
              )}
            </Button>

            {/* Middle: Check answer (in Practice Mode) or status */}
            <div className="flex items-center gap-2">
              {mode === "practice" && !isCurrentChecked && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleCheckCurrentExercise}
                  disabled={!isCurrentExerciseFullyAnswered}
                  className="cursor-pointer gap-1.5 text-xs h-9 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kiểm tra đáp án</span>
                </Button>
              )}

              {mode === "practice" && isCurrentChecked && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã kiểm tra</span>
                </span>
              )}
            </div>

            {/* Next or Submit Button */}
            {allSetsLearnCompleted && isLastExercise ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="cursor-pointer gap-1.5 text-xs h-9 font-bold bg-primary text-primary-foreground shadow-xs"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "Đang chấm điểm..." : "Hoàn thành & Nộp bài"}</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleNext}
                className="cursor-pointer gap-1.5 text-xs h-9 font-semibold shadow-xs"
              >
                <span>
                  {currentExerciseIndex === 3
                    ? isCurrentSetLearnCompleted && !isLastSet
                      ? `Sang Set ${currentSetIndex + 2}`
                      : "Kiểm tra từ vựng (/learn)"
                    : "Tiếp theo"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </footer>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Tạm dừng bài kiểm tra?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tiến độ bài làm của bạn đã được tự động lưu. Bạn có thể quay lại trang chủ và tiếp tục bài thi này bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExitDialogOpen(false)}
              className="cursor-pointer text-xs"
            >
              Tiếp tục làm bài
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={async () => {
                await flushProgress(answers, currentSetIndex, currentExerciseIndex);
                setIsExitDialogOpen(false);
                router.push("/u/personal-test");
              }}
              className="cursor-pointer text-xs font-semibold gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lưu & Thoát</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
