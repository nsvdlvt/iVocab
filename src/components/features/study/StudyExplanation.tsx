"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowRight, CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { AnswerState } from "@/lib/learning/question-types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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

    return clearTimers;
  }, [autoContinue, isCorrect, isNearly]);

  const speakTextWeb = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const hasSynonyms = word.synonyms && word.synonyms.length > 0;
  const hasAntonyms = word.antonyms && word.antonyms.length > 0;

  const statusConfig = isCorrect
    ? {
        icon: CheckCircle2,
        label: "Chính xác!",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      }
    : isNearly
      ? {
          icon: AlertCircle,
          label: "Gần chính xác!",
          className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        }
      : isUnknown
        ? {
            icon: HelpCircle,
            label: "Đã bỏ qua — Hãy ghi nhớ từ này",
            className: "border-border bg-muted/60 text-muted-foreground",
          }
        : {
            icon: XCircle,
            label: "Chưa chính xác — Đáp án đúng bên dưới",
            className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
          };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      <div className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        {/* Status Banner */}
        <div className={cn("flex items-center justify-between px-5 py-2.5 border-b text-xs font-semibold", statusConfig.className)}>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 shrink-0" />
            <span>{statusConfig.label}</span>
          </div>
          {onToggleAutoPlayExplanation && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground" title="Tự động phát âm giải thích">
              <span>Auto-audio</span>
              <Switch
                checked={!!autoPlayExplanationAudio}
                onChange={onToggleAutoPlayExplanation}
                ariaLabel="Tự động phát âm thanh"
              />
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Core word header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-foreground tracking-tight select-text">{word.word}</h3>
                {word.part_of_speech && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none capitalize font-semibold text-xs px-2 py-0.5">
                    {word.part_of_speech}
                  </Badge>
                )}
                {word.ipa && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
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
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 text-left space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Ngữ cảnh câu</p>
              <p className="text-sm text-foreground leading-relaxed select-text">
                {renderFormattedSentence(sentenceContext)}
              </p>
            </div>
          )}

          {/* Structured Example & Notes */}
          {(word.example || word.note || hasSynonyms || hasAntonyms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-left">
              {word.example && (
                <div className="space-y-1 rounded-xl bg-muted/25 p-3 border border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Ví dụ</p>
                  <p className="text-xs font-medium italic text-foreground leading-relaxed select-text">
                    &ldquo;{word.example}&rdquo;
                  </p>
                  {word.example_translation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{word.example_translation}</p>
                  )}
                </div>
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
