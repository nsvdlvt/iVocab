"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PersonalTestRecord,
  PersonalTestAttemptRecord,
  TestMode,
  OverallGradingResult,
  VocabeeExercise,
} from "@/types/vocabee-test";
import { TestProgress } from "./TestProgress";
import { ExerciseRenderer } from "./ExerciseRenderer";
import { TestResult } from "./TestResult";
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
  Save,
  HelpCircle,
  RotateCcw,
  LogOut,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { getQuestionKey } from "@/lib/personal-test/vocabee-test-grader";

interface TestSessionViewProps {
  test: PersonalTestRecord;
  initialAttempt: PersonalTestAttemptRecord;
  initialGrading?: OverallGradingResult | null;
}

export function TestSessionView({
  test,
  initialAttempt,
  initialGrading = null,
}: TestSessionViewProps) {
  const router = useRouter();

  const [attempt, setAttempt] = useState<PersonalTestAttemptRecord>(initialAttempt);
  const [currentSetIndex, setCurrentSetIndex] = useState(initialAttempt.current_set_index || 0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    initialAttempt.current_exercise_index || 0
  );
  const [mode, setMode] = useState<TestMode>(initialAttempt.mode || "practice");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAttempt.answers || {});

  // Practice mode checked state per exercise key: `s{setIndex}_e{exerciseIndex}`
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedGrading, setCompletedGrading] = useState<OverallGradingResult | null>(
    initialGrading
  );

  const currentSet = test.content.sets[currentSetIndex] || test.content.sets[0];
  const currentExercise = currentSet.exercises[currentExerciseIndex];
  const currentExerciseKey = `s${currentSetIndex}_e${currentExerciseIndex}`;
  const isCurrentChecked = !!checkedMap[currentExerciseKey];

  // Total exercises across entire test
  const totalExercisesCount = test.content.sets.length * 4;
  const currentGlobalExerciseNumber = currentSetIndex * 4 + currentExerciseIndex + 1;
  const overallProgress = Math.round((currentGlobalExerciseNumber / totalExercisesCount) * 100);

  // Calculate total questions in current exercise
  const currentExerciseQuestionCount =
    currentExercise.type === "cloze_test"
      ? currentExercise.answers.length
      : currentExercise.items.length;

  // Count answered questions in current exercise
  const answeredInCurrentExercise =
    currentExercise.type === "cloze_test"
      ? currentExercise.answers.filter((a) => {
          const key = getQuestionKey(currentSetIndex, currentExerciseIndex, "cloze_test", a.id);
          return !!answers[key]?.trim();
        }).length
      : currentExercise.items.filter((item) => {
          const key = getQuestionKey(currentSetIndex, currentExerciseIndex, currentExercise.type, item.id);
          return !!answers[key]?.trim();
        }).length;

  const isCurrentExerciseFullyAnswered =
    answeredInCurrentExercise === currentExerciseQuestionCount;

  // Total answered questions across the test
  const answeredTotalCount = Object.values(answers).filter((v) => !!v?.trim()).length;

  // Total questions in test
  let testTotalQuestions = 0;
  test.content.sets.forEach((s) => {
    s.exercises.forEach((ex) => {
      testTotalQuestions += ex.type === "cloze_test" ? ex.answers.length : ex.items.length;
    });
  });

  // Check if we are at the very last exercise of the test
  const isLastExercise =
    currentSetIndex === test.content.sets.length - 1 && currentExerciseIndex === 3;
  const isFirstExercise = currentSetIndex === 0 && currentExerciseIndex === 0;

  // Debounced auto-save checkpoint
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgress = useCallback(
    (newAnswers: Record<string, string>, sIdx: number, eIdx: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveAttemptProgressAction(attempt.id, {
            answers: newAnswers,
            currentSetIndex: sIdx,
            currentExerciseIndex: eIdx,
          });
        } catch (e) {
          console.error("Failed to auto-save attempt progress:", e);
        }
      }, 1000);
    },
    [attempt.id]
  );

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
    toast.success("Đã chấm điểm! Xem giải thích chi tiết phía dưới.");
  };

  const handleNext = () => {
    if (mode === "practice" && !isCurrentChecked) {
      toast.info('Nhấn "Kiểm tra đáp án" trước khi chuyển sang câu tiếp theo.');
      return;
    }

    if (currentExerciseIndex < 3) {
      const nextExIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextExIdx);
      saveProgress(answers, currentSetIndex, nextExIdx);
    } else if (currentSetIndex < test.content.sets.length - 1) {
      const nextSetIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextSetIdx);
      setCurrentExerciseIndex(0);
      saveProgress(answers, nextSetIdx, 0);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      const prevExIdx = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevExIdx);
      saveProgress(answers, currentSetIndex, prevExIdx);
    } else if (currentSetIndex > 0) {
      const prevSetIdx = currentSetIndex - 1;
      setCurrentSetIndex(prevSetIdx);
      setCurrentExerciseIndex(3);
      saveProgress(answers, prevSetIdx, 3);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitAttemptAction(attempt.id, answers);
      if (res.success) {
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
      const res = await startOrResumeAttemptAction(test.id, mode);
      if (res.success) {
        setAttempt(res.attempt);
        setAnswers({});
        setCheckedMap({});
        setCurrentSetIndex(0);
        setCurrentExerciseIndex(0);
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Test Progress & Sticky Header */}
      <TestProgress
        testTitle={test.title}
        totalSets={test.total_sets}
        currentSetIndex={currentSetIndex}
        currentSetLabel={currentSet.label}
        currentExerciseIndex={currentExerciseIndex}
        totalExercisesInSet={4}
        overallProgress={overallProgress}
        mode={mode}
        onModeToggle={(m) => setMode(m)}
        onExit={() => setIsExitDialogOpen(true)}
        answeredCount={answeredTotalCount}
        totalQuestions={testTotalQuestions}
      />

      {/* Main Exercise Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <ExerciseRenderer
          exercise={currentExercise}
          setIndex={currentSetIndex}
          exerciseIndex={currentExerciseIndex}
          userAnswers={answers}
          onAnswerChange={handleAnswerChange}
          mode={mode}
          isChecked={mode === "practice" && isCurrentChecked}
        />
      </main>

      {/* Sticky Bottom Navigation Footer */}
      <footer className="sticky bottom-0 z-20 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Previous button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirstExercise || isSubmitting}
            className="cursor-pointer gap-1.5 text-xs h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Câu trước</span>
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
          {isLastExercise ? (
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
              disabled={mode === "practice" && !isCurrentChecked}
              className="cursor-pointer gap-1.5 text-xs h-9 font-semibold shadow-xs"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>

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
              onClick={() => {
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
