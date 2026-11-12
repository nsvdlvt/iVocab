"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";
import { AnswerState, QuestionDirection, QuestionType } from "@/lib/learning/question-types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface StudyExplanationProps {
  word: VocabularyRow;
  answerState: AnswerState;
  onContinue: () => void;
  autoContinue: boolean;
  autoPlayExplanationAudio?: boolean;
  onToggleAutoPlayExplanation?: () => void;
  onSpeakWord?: () => void;
  sentenceContext?: string; // Optional sentence dictation context
  correctAnswer?: string;
  direction?: QuestionDirection;
  questionType?: QuestionType;
}

function renderFormattedSentence(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-primary underline decoration-primary/40 underline-offset-4">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function cleanExampleSentence(example?: string | null): string | null {
  if (!example) return null;
  // Clean markdown bold or special formatting if any
  const cleaned = example.replace(/\*\*(.*?)\*\*/g, "$1").trim();
  return cleaned || null;
}

export function StudyExplanation({
  word,
  answerState,
  onContinue,
  autoContinue,
  autoPlayExplanationAudio,
  onToggleAutoPlayExplanation,
  onSpeakWord,
  sentenceContext,
  correctAnswer,
  direction,
}: StudyExplanationProps) {
  const isCorrect = answerState === "correct";
  const isNearly = answerState === "near";
  const isUnknown = answerState === "unknown";
  const [countdown, setCountdown] = useState(2);
  const continueRef = useRef(onContinue);
  const countdownIntervalRef = useRef<number | null>(null);
  const continueTimeoutRef = useRef<number | null>(null);

  // The actual expected answer for the specific question direction
  const targetAnswer =
    correctAnswer ||
    (direction === "en-vi" ? word.meaning : word.word);

  useEffect(() => {
    continueRef.current = onContinue;
  }, [onContinue]);

  // Auto transition countdown
  useEffect(() => {
    const resetCountdownHandle = window.setTimeout(() => {
      setCountdown(2);
    }, 0);

    const clearTimers = () => {
      clearTimeout(resetCountdownHandle);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (continueTimeoutRef.current) {
        clearTimeout(continueTimeoutRef.current);
        continueTimeoutRef.current = null;
      }
    };

    clearTimers();

    if (autoContinue && (isCorrect || isNearly)) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      continueTimeoutRef.current = window.setTimeout(() => {
        continueRef.current();
      }, 2000);

      return clearTimers;
    }

    return () => {
      clearTimeout(resetCountdownHandle);
    };
  }, [autoContinue, isCorrect, isNearly]);

  const speakTextWeb = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const exampleSentence = cleanExampleSentence(word.example);
  const formattedSynonyms = Array.isArray(word.synonyms)
    ? word.synonyms.filter(Boolean).join("; ")
    : typeof word.synonyms === "string"
    ? word.synonyms
    : "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none">
      {/* Optional Dictation Context Card (for dictation flows) */}
      {sentenceContext && (
        <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-left space-y-1 select-text">
          <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Ngữ cảnh câu</p>
          <p className="text-sm text-foreground leading-relaxed">
            {renderFormattedSentence(sentenceContext)}
          </p>
          {word.example_translation && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
              <HighlightedSentence
                sentence={word.example_translation}
                type="vi"
                meaning={word.meaning}
              />
            </p>
          )}
        </div>
      )}

      {/* Minimal Vocabulary Explanation Container */}
      <div
        className={cn(
          "w-full rounded-xl border p-4 sm:p-5 text-left transition-all space-y-2.5 sm:space-y-3 select-text shadow-2xs",
          isCorrect && "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
          isNearly && "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
          isUnknown && "border-slate-200/80 bg-slate-50/60 dark:border-slate-800/40 dark:bg-slate-900/20",
          !isCorrect && !isNearly && !isUnknown && "border-rose-200/80 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20"
        )}
      >
        {/* Line 1: Chưa chính xác | Đáp án đúng: Exhaustive | Auto Sound */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap text-sm sm:text-base leading-normal">
          {isCorrect && (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              Chính xác
            </span>
          )}
          {isNearly && (
            <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              Gần đúng
            </span>
          )}
          {isUnknown && (
            <span className="font-semibold text-muted-foreground shrink-0">
              Ghi nhớ từ này
            </span>
          )}
          {!isCorrect && !isNearly && !isUnknown && (
            <span className="font-semibold text-rose-600 dark:text-rose-400 shrink-0">
              Chưa chính xác
            </span>
          )}

          <span className="text-muted-foreground/40 select-none">|</span>

          <span className="text-muted-foreground">
            Đáp án đúng:{" "}
            <span className="font-semibold text-foreground break-words">{targetAnswer}</span>
          </span>

          {onToggleAutoPlayExplanation && (
            <>
              <span className="text-muted-foreground/40 select-none">|</span>
              <label
                className="inline-flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm text-muted-foreground hover:text-foreground select-none"
                title="Tự động phát âm thanh giải thích"
              >
                <span>Auto Sound</span>
                <Switch
                  checked={!!autoPlayExplanationAudio}
                  onChange={onToggleAutoPlayExplanation}
                  ariaLabel="Tự động phát âm thanh giải thích"
                />
              </label>
            </>
          )}
        </div>

        {/* Line 2: Exhaustive | IPA | adjective */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap text-sm sm:text-base leading-normal">
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight break-words">
            {word.word}
          </span>

          <button
            type="button"
            onClick={onSpeakWord || (() => speakTextWeb(word.word))}
            className="h-6 w-6 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Nghe phát âm"
          >
            <Volume2 className="h-4 w-4" />
          </button>

          {word.ipa && (
            <>
              <span className="text-muted-foreground/40 select-none">|</span>
              <span className="font-mono text-xs sm:text-sm text-muted-foreground break-words">
                {word.ipa}
              </span>
            </>
          )}

          {word.part_of_speech && (
            <>
              <span className="text-muted-foreground/40 select-none">|</span>
              <span className="text-xs sm:text-sm text-muted-foreground italic lowercase break-words">
                {word.part_of_speech}
              </span>
            </>
          )}
        </div>

        {/* Line 3: Đồng nghĩa: Comprehensive; Thorough; Extensive */}
        {formattedSynonyms ? (
          <div className="text-xs sm:text-sm leading-normal text-foreground break-words">
            <span className="text-muted-foreground font-medium">Đồng nghĩa: </span>
            <span>{formattedSynonyms}</span>
          </div>
        ) : null}

        {/* Line 4: Nghĩa: Toàn diện; thấu đáo; bao quát mọi khía cạnh */}
        {word.meaning && (
          <div className="text-xs sm:text-sm leading-normal text-foreground break-words">
            <span className="text-muted-foreground font-medium">Nghĩa: </span>
            <span className="font-medium text-foreground">{word.meaning}</span>
          </div>
        )}

        {/* Line 5: Ví dụ: The researchers conducted an exhaustive investigation into the causes of the accident */}
        {(exampleSentence || word.example_translation) && (
          <div className="text-xs sm:text-sm leading-relaxed text-foreground break-words">
            <span className="text-muted-foreground font-medium">Ví dụ: </span>
            {exampleSentence && <span className="italic text-foreground/95">{exampleSentence}</span>}
            {word.example_translation && (
              <span className="block text-xs text-muted-foreground italic mt-0.5">
                {word.example_translation}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prominent Continue Button */}
      <Button
        onClick={onContinue}
        size="lg"
        className="rounded-xl h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2 cursor-pointer select-none flex items-center justify-center transition-all shadow-xs"
      >
        <span>
          Tiếp tục {autoContinue && (isCorrect || isNearly) && countdown > 0 ? `(${countdown}s)` : ""}
        </span>
        <kbd className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground shadow-none text-[11px] px-1.5 py-0.5 rounded">
          Enter
        </kbd>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
