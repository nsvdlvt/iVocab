"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { AnswerState } from "@/lib/learning/question-types";
import { Switch } from "@/components/ui/switch";

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
  const hasDetails = !!(word.ipa || word.part_of_speech || word.example || word.note || hasSynonyms || hasAntonyms);

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 select-none">
      <div className="border border-border/80 rounded-2xl p-4 bg-card shadow-xs space-y-3">
        {/* Core word block */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2 flex-wrap text-left">
            <h3 className="text-lg font-bold text-foreground tracking-tight">{word.word}</h3>
            {word.part_of_speech && (
              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none capitalize font-bold text-[9px] px-1.5 py-0">
                {word.part_of_speech}
              </Badge>
            )}
            {word.ipa && (
              <span className="font-mono text-xs text-muted-foreground">{word.ipa}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSpeakWord || (() => speakTextWeb(word.word))}
              className="h-8 w-8 rounded-lg text-indigo-600 hover:text-indigo-500 hover:bg-indigo-500/5 cursor-pointer shrink-0"
              title="Phát âm"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            {onToggleAutoPlayExplanation && (
              <div className="flex items-center ml-1" title="Tự động phát âm thanh">
                <Switch
                  checked={!!autoPlayExplanationAudio}
                  onChange={onToggleAutoPlayExplanation}
                  ariaLabel="Tự động phát âm thanh"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic sentence dictation display */}
        {sentenceContext && (
          <div className="p-3 bg-muted/30 rounded-xl border text-left text-xs font-semibold leading-relaxed">
            <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Ngữ cảnh câu</p>
            <p className="text-foreground leading-snug">{sentenceContext}</p>
          </div>
        )}

        {/* Details Grid layout */}
        {hasDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Meaning and Notes */}
            <div className="space-y-2 text-left">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">Ý NGHĨA</p>
                <p className="font-semibold text-foreground leading-snug">{word.meaning}</p>
              </div>
              {word.note && (
                <div className="space-y-0.5 border-t border-border/40 pt-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">GHI CHÚ</p>
                  <p className="text-muted-foreground leading-relaxed">{word.note}</p>
                </div>
              )}
            </div>

            {/* Example, Synonyms & Antonyms */}
            <div className="space-y-2 text-left">
              {word.example && (
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">VÍ DỤ</p>
                  <p className="font-medium italic text-foreground leading-relaxed">&ldquo;{word.example}&rdquo;</p>
                  {word.example_translation && (
                    <p className="text-[11px] text-muted-foreground leading-normal">{word.example_translation}</p>
                  )}
                </div>
              )}

              {(hasSynonyms || hasAntonyms) && (
                <div className="space-y-1.5 border-t border-border/40 pt-1.5">
                  {hasSynonyms && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">ĐỒNG NGHĨA</p>
                      <div className="flex flex-wrap gap-1">
                        {word.synonyms?.map((syn, idx) => (
                          <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-semibold">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasAntonyms && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">TRÁI NGHĨA</p>
                      <div className="flex flex-wrap gap-1">
                        {word.antonyms?.map((ant, idx) => (
                          <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-semibold">
                            {ant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <Button
        onClick={onContinue}
        className="rounded-xl h-10 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 cursor-pointer select-none flex items-center justify-center transition-all"
      >
        <span>Tiếp tục {autoContinue && (isCorrect || isNearly) && countdown > 0 ? `(${countdown})` : ""}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
