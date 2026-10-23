"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowRight, CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { AnswerState } from "@/lib/learning/question-types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  HighlightedExample,
  HighlightedSentence,
} from "@/components/common/HighlightedExample";

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

export function StudyExplanation({
  word,
  answerState,
  onContinue,
  autoContinue,
  autoPlayExplanationAudio,
  onToggleAutoPlayExplanation,
  onSpeakWord,
  sentenceContext,
}: StudyExplanationProps) {
  const isCorrect = answerState === "correct";
  const isNearly = answerState === "near";
  const isUnknown = answerState === "unknown";
  const [countdown, setCountdown] = useState(2);
  const continueRef = useRef(onContinue);
  const countdownIntervalRef = useRef<number | null>(null);
  const continueTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    continueRef.current = onContinue;
  }, [onContinue]);

  // Auto transition layout
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

  useEffect(() => {
    if (autoPlayExplanationAudio && (isCorrect || isNearly)) {
      const timer = setTimeout(() => {
        if (onSpeakWord) onSpeakWord();
        else speakTextWeb(word.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoPlayExplanationAudio, isCorrect, isNearly, word.word, onSpeakWord]);

  const hasSynonyms = Boolean(word.synonyms && word.synonyms.length > 0);
  const hasAntonyms = Boolean(word.antonyms && word.antonyms.length > 0);
  const hasExamples = Boolean(word.example || word.example_translation);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4 text-center transition-all",
          isCorrect && "border-emerald-500/30 bg-emerald-500/5",
          isNearly && "border-amber-500/30 bg-amber-500/5",
          isUnknown && "border-slate-500/30 bg-slate-500/5",
          !isCorrect && !isNearly && !isUnknown && "border-rose-500/30 bg-rose-500/5"
        )}
      >
        {/* Status header banner */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            {isCorrect && (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                  Chính xác!
                </span>
              </>
            )}
            {isNearly && (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-sm text-amber-800 dark:text-amber-200">
                  Gần đúng! Chú ý chính tả nhé.
                </span>
              </>
            )}
            {isUnknown && (
              <>
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-bold text-sm text-foreground">
                  Ghi nhớ từ này nhé!
                </span>
              </>
            )}
            {!isCorrect && !isNearly && !isUnknown && (
              <>
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-bold text-sm text-rose-800 dark:text-rose-200">
                  Chưa chính xác
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleAutoPlayExplanation && (
              <div className="flex items-center gap-1.5" title="Tự động phát âm thanh giải thích">
                <Switch
                  checked={!!autoPlayExplanationAudio}
                  onChange={onToggleAutoPlayExplanation}
                  ariaLabel="Tự động phát âm thanh giải thích"
                />
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {word.difficulty && (
              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                {word.difficulty}
              </Badge>
            )}
          </div>
        </div>

        {/* Word Information Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-3.5 bg-background/80 rounded-xl border border-border/80 text-left">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight select-text">
                  {word.word}
                </span>
                {word.part_of_speech && (
                  <Badge variant="secondary" className="text-[11px] capitalize">
                    {word.part_of_speech}
                  </Badge>
                )}
                {word.ipa && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    {word.ipa}
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-foreground/90 leading-snug select-text">
                {word.meaning}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={onSpeakWord || (() => speakTextWeb(word.word))}
              className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 border-border/80 cursor-pointer shrink-0"
              title="Phát âm"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Dynamic sentence dictation display */}
          {sentenceContext && (
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 text-left space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Ngữ cảnh câu</p>
              <p className="text-sm text-foreground leading-relaxed select-text">
                {renderFormattedSentence(sentenceContext)}
              </p>
              {word.example_translation && (
                <p className="text-xs text-muted-foreground leading-relaxed select-text pt-1 border-t border-border/40">
                  <HighlightedSentence
                    sentence={word.example_translation}
                    type="vi"
                    meaning={word.meaning}
                  />
                </p>
              )}
            </div>
          )}

          {/* Structured Example & Notes */}
          {(hasExamples || word.note || hasSynonyms || hasAntonyms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-left">
              {hasExamples && (
                <HighlightedExample
                  word={word.word}
                  meaning={word.meaning}
                  example={word.example}
                  exampleTranslation={word.example_translation}
                  showLabels
                  compact
                />
              )}

              {(word.note || hasSynonyms || hasAntonyms) && (
                <div className="space-y-2.5 rounded-xl bg-muted/25 p-3 border border-border/40">
                  {word.note && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Ghi chú</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{word.note}</p>
                    </div>
                  )}
                  {hasSynonyms && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Đồng nghĩa</p>
                      <div className="flex flex-wrap gap-1">
                        {word.synonyms?.map((syn, idx) => (
                          <span key={idx} className="bg-background border border-border/60 px-2 py-0.5 rounded-md text-[11px] text-foreground/80 font-medium">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasAntonyms && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Trái nghĩa</p>
                      <div className="flex flex-wrap gap-1">
                        {word.antonyms?.map((ant, idx) => (
                          <span key={idx} className="bg-background border border-border/60 px-2 py-0.5 rounded-md text-[11px] text-foreground/80 font-medium">
                            {ant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      <Button
        onClick={onContinue}
        className="rounded-xl h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2 cursor-pointer select-none flex items-center justify-center transition-all shadow-xs"
      >
        <span>
          Tiếp tục {autoContinue && (isCorrect || isNearly) && countdown > 0 ? `(${countdown}s)` : ""}
        </span>
        <kbd className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground shadow-none">
          Enter
        </kbd>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
