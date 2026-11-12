"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LearnQuestion, AnswerState, LearnOption } from "@/lib/learning/question-types";
import { Check, Pencil, Star, Volume2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCompactMeaning } from "@/lib/learning/distractor-generator";

// In-memory client cache for dynamically looked up non-AI dictionary meanings
const dictionaryLookupCache = new Map<string, string>();

interface LearnMCQProps {
  question: LearnQuestion;
  selectedOptionId: string | null;
  answerState: AnswerState;
  onSelectOption: (optionId: string) => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onToggleStar?: () => void;
  isStarred?: boolean;
  autoPlayQuestionAudio?: boolean;
  onToggleAutoPlayQuestion?: () => void;
  onSpeakPrompt?: () => void;
}

interface ResolvedOptionData {
  englishText: string;
  vietnameseMeaning: string;
}

function resolveInitialOptionData(option: LearnOption, question: LearnQuestion): ResolvedOptionData {
  // 1. If explicit english and meaning are already provided
  if (option.english && option.meaning) {
    return {
      englishText: option.english,
      vietnameseMeaning: formatCompactMeaning(option.meaning),
    };
  }

  // 2. If option is the correct option, prioritize word data from question
  if (option.id === question.correctOptionId || option.isCorrect) {
    return {
      englishText: question.word?.word || option.english || (question.direction === "vi-en" ? option.text : ""),
      vietnameseMeaning: formatCompactMeaning(
        question.word?.meaning || option.meaning || (question.direction === "en-vi" ? option.text : "")
      ),
    };
  }

  // 3. If direction is vi-en, option.text is the English word
  if (question.direction === "vi-en") {
    return {
      englishText: option.english || option.text,
      vietnameseMeaning: formatCompactMeaning(option.meaning),
    };
  }

  // 4. If direction is en-vi, option.text is Vietnamese meaning
  return {
    englishText: option.english || "",
    vietnameseMeaning: formatCompactMeaning(option.meaning || option.text),
  };
}

export function LearnMCQ({
  question,
  selectedOptionId,
  answerState,
  onSelectOption,
  onSkip,
  onEdit,
  onToggleStar,
  isStarred,
  autoPlayQuestionAudio,
  onToggleAutoPlayQuestion,
  onSpeakPrompt,
}: LearnMCQProps) {
  const isSubmitted = answerState !== "unanswered";

  // Dynamic dictionary lookup state for options missing Vietnamese meaning
  const [dynamicMeanings, setDynamicMeanings] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function lookupMissingMeanings() {
      for (const opt of question.options) {
        const resolved = resolveInitialOptionData(opt, question);
        if (!resolved.vietnameseMeaning && resolved.englishText) {
          const cacheKey = resolved.englishText.toLowerCase().trim();
          if (dictionaryLookupCache.has(cacheKey)) {
            const cached = dictionaryLookupCache.get(cacheKey);
            if (cached && isMounted) {
              setDynamicMeanings((prev) => ({ ...prev, [opt.id]: cached }));
            }
            continue;
          }

          // Lookup non-AI dictionary/translation endpoint
          try {
            const res = await fetch(`/api/dictionary/lookup?q=${encodeURIComponent(resolved.englishText)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                const viDef =
                  data.data.vietnameseMeaning ||
                  data.data.meanings?.[0]?.definitionVi ||
                  data.data.meanings?.[0]?.definitions?.[0]?.definitionVi;
                if (viDef) {
                  const cleaned = formatCompactMeaning(viDef);
                  dictionaryLookupCache.set(cacheKey, cleaned);
                  if (isMounted) {
                    setDynamicMeanings((prev) => ({ ...prev, [opt.id]: cleaned }));
                  }
                  continue;
                }
              }
            }

            // Fallback non-AI translation lookup if dictionary had no Vietnamese definition
            const transRes = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: resolved.englishText,
                sourceLang: "en",
                targetLang: "vi",
              }),
            });
            if (transRes.ok) {
              const transData = await transRes.json();
              if (transData.success && transData.data?.translatedText) {
                const cleaned = formatCompactMeaning(transData.data.translatedText);
                dictionaryLookupCache.set(cacheKey, cleaned);
                if (isMounted) {
                  setDynamicMeanings((prev) => ({ ...prev, [opt.id]: cleaned }));
                }
                continue;
              }
            }

            dictionaryLookupCache.set(cacheKey, "");
          } catch {
            dictionaryLookupCache.set(cacheKey, "");
          }
        }
      }
    }

    lookupMissingMeanings();

    return () => {
      isMounted = false;
    };
  }, [question]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2.5 sm:space-y-4 select-none">
      {/* Question Prompt Card */}
      <div className="relative py-4 sm:py-9 px-3.5 sm:px-6 border border-border/80 rounded-2xl bg-card shadow-xs">
        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {question.direction === "en-vi" && onSpeakPrompt && (
              <button
                type="button"
                onClick={onSpeakPrompt}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground inline-flex items-center justify-center cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
            {question.direction === "en-vi" && onToggleAutoPlayQuestion && (
              <div className="flex items-center" title="Tự động phát âm thanh">
                <Switch
                  checked={!!autoPlayQuestionAudio}
                  onChange={onToggleAutoPlayQuestion}
                  ariaLabel="Tự động phát âm thanh"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground inline-flex items-center justify-center cursor-pointer"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onToggleStar && (
              <button
                type="button"
                onClick={onToggleStar}
                className={cn(
                  "h-8 w-8 rounded-lg bg-transparent transition-colors hover:bg-muted inline-flex items-center justify-center cursor-pointer",
                  isStarred
                    ? "text-amber-500 hover:text-amber-500"
                    : "text-muted-foreground hover:text-amber-500"
                )}
                title={isStarred ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích"}
              >
                <Star className={cn("h-4 w-4", isStarred && "fill-amber-400 text-amber-500")} />
              </button>
            )}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Chọn đáp án đúng ({question.direction === "en-vi" ? "Anh → Việt" : "Việt → Anh"})
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug px-2 line-clamp-3 select-text">
            {question.prompt}
          </h2>
        </div>
      </div>

      {/* 2-Column Responsive Options Grid with uniform height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const isWrongSelected = isSelected && !isCorrectOption;

          // Resolve English and Vietnamese texts
          const baseData = resolveInitialOptionData(option, question);
          const englishText = baseData.englishText || option.text;
          const vietnameseMeaning = dynamicMeanings[option.id] || baseData.vietnameseMeaning;

          let btnClass =
            "border-2 border-b-[4px] border-border/90 bg-card hover:border-primary/50 hover:bg-primary/[0.03] active:translate-y-[2px] active:border-b-2 cursor-pointer text-foreground shadow-2xs";
          let kbdClass = "bg-muted/80 text-muted-foreground border-border";
          let englishClass = "text-foreground font-semibold";
          let meaningClass = "text-muted-foreground/80 font-normal italic";

          if (isSubmitted) {
            if (isCorrectOption) {
              btnClass =
                "border-2 border-b-[4px] border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 cursor-default ring-1 ring-emerald-500/30";
              kbdClass = "bg-emerald-500 text-white border-emerald-500 shadow-none";
              englishClass = "text-emerald-950 dark:text-emerald-100 font-bold";
              meaningClass = "text-emerald-700/90 dark:text-emerald-300/80 font-medium italic";
            } else if (isWrongSelected) {
              btnClass =
                "border-2 border-b-[4px] border-rose-500 bg-rose-500/10 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 cursor-default ring-1 ring-rose-500/30";
              kbdClass = "bg-rose-500 text-white border-rose-500 shadow-none";
              englishClass = "text-rose-950 dark:text-rose-100 font-bold";
              meaningClass = "text-rose-700/90 dark:text-rose-300/80 font-medium italic";
            } else {
              // Unselected options after submit: clean neutral look
              btnClass =
                "border-2 border-b-[2px] border-border/70 bg-card/60 dark:bg-card/40 text-foreground/80 cursor-default opacity-75";
              kbdClass = "bg-muted/40 text-muted-foreground/60 border-border/40 shadow-none";
              englishClass = "text-foreground/80 font-semibold";
              meaningClass = "text-muted-foreground/75 font-normal italic";
            }
          } else if (isSelected) {
            btnClass =
              "border-2 border-b-[4px] border-primary bg-primary/[0.08] text-primary hover:bg-primary/10 cursor-pointer ring-1 ring-primary/20";
            kbdClass = "bg-primary text-primary-foreground border-primary shadow-none";
            englishClass = "text-primary font-bold";
            meaningClass = "text-primary/80 font-medium italic";
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectOption(option.id)}
              className={cn(
                "w-full text-left p-3 sm:p-4 rounded-xl border outline-none flex items-center justify-between gap-3 transition-all duration-150 h-full min-h-[58px] sm:min-h-[66px]",
                btnClass
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* 1, 2, 3, 4 keyboard badge */}
                <kbd
                  className={cn(
                    "h-6 w-6 rounded-md text-xs font-bold shrink-0 transition-colors flex items-center justify-center select-none",
                    kbdClass
                  )}
                >
                  {idx + 1}
                </kbd>

                {/* Content: In answering mode, show only option.text to test the user without leaking meanings; in explanation mode (after submit), reveal English + Vietnamese meaning */}
                {isSubmitted ? (
                  <div className="flex flex-col min-w-0 flex-1 justify-center animate-in fade-in duration-200">
                    <span className={cn("text-sm sm:text-base leading-snug break-words", englishClass)}>
                      {englishText || option.text}
                    </span>
                    {vietnameseMeaning &&
                    vietnameseMeaning.trim().toLowerCase() !== (englishText || option.text).trim().toLowerCase() ? (
                      <span className={cn("text-xs leading-snug break-words mt-0.5 line-clamp-2", meaningClass)}>
                        {vietnameseMeaning}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center">
                    <span className={cn("text-sm sm:text-base leading-snug break-words font-medium", englishClass)}>
                      {option.text}
                    </span>
                  </div>
                )}
              </div>

              {/* State Icons */}
              {isSubmitted && (isCorrectOption || isWrongSelected) && (
                <div className="shrink-0 pl-1 animate-in fade-in duration-150">
                  {isCorrectOption ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!isSubmitted && onSkip && (
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-muted/60"
          >
            <span>Không biết</span>
            <kbd className="h-5 min-w-[20px] px-1 rounded border border-border text-[11px] font-mono text-muted-foreground flex items-center justify-center">
              5
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}
