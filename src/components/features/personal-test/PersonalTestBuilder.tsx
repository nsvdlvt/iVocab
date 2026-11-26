"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, ListChecks, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SetSelectionStep } from "./SetSelectionStep";
import { WordSelectionStep } from "./WordSelectionStep";
import { TestConfigStep } from "./TestConfigStep";
import {
  type SelectableVocabSet,
  type SelectableVocabularyWord,
  deduplicateSelectedVocabulary,
  MAX_WORDS_FOR_PERSONAL_TEST,
  normalizeWordKey,
  selectPriorityWordIdsToCap,
  suggestTestTitle,
} from "@/lib/personal-test/vocabulary-selection";

interface PersonalTestBuilderProps {
  selectableSets: SelectableVocabSet[];
  onSuccess?: (testId: string) => void;
}

type BuilderStep = 1 | 2 | 3;

const STEPS: Array<{
  step: BuilderStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    step: 1,
    title: "Chọn bộ từ vựng",
    subtitle: "Chọn 1 hoặc nhiều bộ từ của bạn",
    icon: Layers,
  },
  {
    step: 2,
    title: "Chọn từ vựng",
    subtitle: "Lọc và chọn từng từ muốn kiểm tra",
    icon: ListChecks,
  },
  {
    step: 3,
    title: "Cấu hình & Tạo đề",
    subtitle: "Đặt tiêu đề và tạo đề 4 kỹ năng",
    icon: SlidersHorizontal,
  },
];

export function PersonalTestBuilder({
  selectableSets,
  onSuccess,
}: PersonalTestBuilderProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<BuilderStep>(1);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(() => new Set());
  const [wordsCacheBySet, setWordsCacheBySet] = useState<
    Record<string, SelectableVocabularyWord[]>
  >({});
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(() => new Set());
  const [isLoadingWords, setIsLoadingWords] = useState(false);

  const [customTitle, setCustomTitle] = useState("");
  const [hasEditedTitle, setHasEditedTitle] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedSetsList = useMemo(
    () => selectableSets.filter((s) => selectedSetIds.has(s.id)),
    [selectableSets, selectedSetIds]
  );

  // All words belonging to currently selected sets (preserving load order without duplicates)
  const availableWordsFromSelectedSets = useMemo(() => {
    const result: SelectableVocabularyWord[] = [];
    const seen = new Set<string>();
    for (const set of selectedSetsList) {
      const setWords = wordsCacheBySet[set.id] ?? [];
      for (const w of setWords) {
        if (!seen.has(w.id)) {
          seen.add(w.id);
          result.push(w);
        }
      }
    }
    return result;
  }, [selectedSetsList, wordsCacheBySet]);

  const selectedRecords = useMemo(
    () => availableWordsFromSelectedSets.filter((w) => selectedWordIds.has(w.id)),
    [availableWordsFromSelectedSets, selectedWordIds]
  );

  const deduplicatedTargets = useMemo(
    () => deduplicateSelectedVocabulary(selectedRecords),
    [selectedRecords]
  );

  const suggestedTitle = useMemo(() => {
    const activeSetIds = new Set(selectedRecords.map((r) => r.set_id));
    const activeSets = selectedSetsList.filter((s) => activeSetIds.has(s.id));
    return suggestTestTitle(
      activeSets.length > 0 ? activeSets : selectedSetsList,
      deduplicatedTargets.length
    );
  }, [selectedRecords, selectedSetsList, deduplicatedTargets.length]);

  const effectiveTitle = hasEditedTitle ? customTitle : suggestedTitle;

  // Toggle set selection and prune selected words if a set was unchecked
  const handleToggleSet = (setId: string) => {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
        // Remove words belonging exclusively to the deselected set
        const removedSetWords = wordsCacheBySet[setId];
        if (removedSetWords && removedSetWords.length > 0) {
          const removedIds = new Set(removedSetWords.map((w) => w.id));
          setSelectedWordIds((prevWords) => {
            const nextWords = new Set(prevWords);
            for (const id of removedIds) {
              nextWords.delete(id);
            }
            return nextWords;
          });
        }
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  const handleSelectVisibleSets = (visibleIds: string[]) => {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeselectAllSets = () => {
    setSelectedSetIds(new Set());
    setSelectedWordIds(new Set());
  };

  // Load words for any selected set not yet cached
  const loadWordsForSelectedSets = async () => {
    const missingSetIds = Array.from(selectedSetIds).filter(
      (id) => !(id in wordsCacheBySet)
    );

    if (missingSetIds.length === 0) {
      setCurrentStep(2);
      return;
    }

    setIsLoadingWords(true);
    try {
      const params = new URLSearchParams({ setIds: missingSetIds.join(",") });
      const res = await fetch(`/api/personal-test/vocabulary?${params.toString()}`, {
        method: "GET",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Không thể tải danh sách từ vựng.");
        return;
      }

      const fetchedWords = (json.words ?? []) as SelectableVocabularyWord[];
      const grouped: Record<string, SelectableVocabularyWord[]> = {};
      for (const id of missingSetIds) {
        grouped[id] = [];
      }
      for (const w of fetchedWords) {
        if (!grouped[w.set_id]) grouped[w.set_id] = [];
        grouped[w.set_id].push(w);
      }

      setWordsCacheBySet((prev) => ({ ...prev, ...grouped }));
      setCurrentStep(2);
    } catch {
      toast.error("Lỗi kết nối khi tải từ vựng. Vui lòng thử lại.");
    } finally {
      setIsLoadingWords(false);
    }
  };

  const handleToggleWord = (wordId: string) => {
    if (selectedWordIds.has(wordId)) {
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        next.delete(wordId);
        return next;
      });
      return;
    }

    const targetRecord = availableWordsFromSelectedSets.find((w) => w.id === wordId);
    if (targetRecord) {
      const norm = normalizeWordKey(targetRecord.word);
      const alreadyHasWord = deduplicatedTargets.some((t) => t.normalizedWord === norm);
      if (!alreadyHasWord && deduplicatedTargets.length >= MAX_WORDS_FOR_PERSONAL_TEST) {
        toast.warning(
          `Đã đạt tối đa ${MAX_WORDS_FOR_PERSONAL_TEST} từ mục tiêu. Hãy bỏ chọn bớt từ nếu bạn muốn chọn từ khác.`
        );
        return;
      }
    }

    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  };

  const handleSelectManyWords = (wordIds: string[]) => {
    const idSet = new Set(wordIds);
    const candidates = availableWordsFromSelectedSets.filter((w) => idSet.has(w.id));
    const { idsToAdd, totalEligibleUnique, wasCapped } = selectPriorityWordIdsToCap(
      candidates,
      selectedRecords,
      MAX_WORDS_FOR_PERSONAL_TEST
    );

    if (idsToAdd.length === 0) {
      if (deduplicatedTargets.length >= MAX_WORDS_FOR_PERSONAL_TEST) {
        toast.info(
          `Đã đạt tối đa ${MAX_WORDS_FOR_PERSONAL_TEST} từ mục tiêu. Bỏ chọn bớt nếu bạn muốn thay thế.`
        );
      } else {
        toast.info("Tất cả từ phù hợp trong danh sách này đã được chọn.");
      }
      return;
    }

    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToAdd) {
        next.add(id);
      }
      return next;
    });

    if (wasCapped) {
      toast.success(
        `Đã tự động chọn ${idsToAdd.length} từ ưu tiên (ưu tiên level thấp nhất) trong tổng số ${totalEligibleUnique} từ để vừa giới hạn ${MAX_WORDS_FOR_PERSONAL_TEST} từ.`
      );
    } else {
      toast.success(`Đã chọn ${idsToAdd.length} từ vựng.`);
    }
  };

  const handleDeselectManyWords = (wordIds: string[]) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      for (const id of wordIds) {
        next.delete(id);
      }
      return next;
    });
  };

  const handleClearAllSelectedWords = () => {
    setSelectedWordIds(new Set());
  };

  const handleStepClick = (targetStep: BuilderStep) => {
    if (isGenerating) return;
    if (targetStep === 1) {
      setCurrentStep(1);
    } else if (targetStep === 2 && selectedSetIds.size > 0) {
      void loadWordsForSelectedSets();
    } else if (targetStep === 3 && deduplicatedTargets.length >= 2) {
      setCurrentStep(3);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setGenerationError(null);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/personal-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: effectiveTitle.trim(),
          vocabularyIds: selectedRecords.map((r) => r.id),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        const msg =
          json.error || "Không thể tạo bài kiểm tra. Vui lòng thử lại.";
        setGenerationError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Đã tạo bài kiểm tra cá nhân thành công!");
      onSuccess?.(json.testId);
      router.push(`/u/personal-test/${json.testId}`);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.info("Đã hủy yêu cầu tạo bài kiểm tra.");
      } else {
        const msg = "Lỗi kết nối khi tạo bài kiểm tra. Vui lòng thử lại.";
        setGenerationError(msg);
        toast.error(msg);
      }
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleCancelGenerate = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="space-y-6">
      {/* 3-Step Indicator */}
      <nav
        aria-label="Các bước tạo bài kiểm tra"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {STEPS.map((item) => {
          const Icon = item.icon;
          const isActive = currentStep === item.step;
          const isCompleted = currentStep > item.step;
          const isClickable =
            !isGenerating &&
            (item.step === 1 ||
              (item.step === 2 && selectedSetIds.size > 0) ||
              (item.step === 3 && deduplicatedTargets.length >= 2));

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => handleStepClick(item.step)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                isActive
                  ? "border-primary bg-primary/[0.06] shadow-2xs ring-1 ring-primary/30"
                  : isCompleted
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                  : "border-border/80 bg-card hover:border-border"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bước {item.step}
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Active Step Content */}
      {currentStep === 1 && (
        <SetSelectionStep
          sets={selectableSets}
          selectedSetIds={selectedSetIds}
          onToggleSet={handleToggleSet}
          onSelectVisibleSets={handleSelectVisibleSets}
          onDeselectAllSets={handleDeselectAllSets}
          onContinue={loadWordsForSelectedSets}
          isLoadingWords={isLoadingWords}
        />
      )}

      {currentStep === 2 && (
        <WordSelectionStep
          selectedSets={selectedSetsList}
          words={availableWordsFromSelectedSets}
          selectedWordIds={selectedWordIds}
          onToggleWord={handleToggleWord}
          onSelectManyWords={handleSelectManyWords}
          onDeselectManyWords={handleDeselectManyWords}
          onClearAllSelected={handleClearAllSelectedWords}
          onBack={() => setCurrentStep(1)}
          onContinue={() => {
            setGenerationError(null);
            setCurrentStep(3);
          }}
        />
      )}

      {currentStep === 3 && (
        <TestConfigStep
          title={effectiveTitle}
          onTitleChange={(val) => {
            setHasEditedTitle(true);
            setCustomTitle(val);
          }}
          selectedRecords={selectedRecords}
          deduplicatedTargets={deduplicatedTargets}
          selectedSets={selectedSetsList}
          onBack={() => setCurrentStep(2)}
          onGenerate={handleGenerate}
          onCancelGenerate={handleCancelGenerate}
          isGenerating={isGenerating}
          generationError={generationError}
        />
      )}
    </div>
  );
}
