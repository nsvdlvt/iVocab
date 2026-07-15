"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashcardRow, getFlashcardLevel, getLevelBadgeClass, getPartOfSpeechLabel } from "./flashcard-utils";

interface FlashcardDeckProps {
  word: FlashcardRow | null;
  flipped: boolean;
  showIpa: boolean;
  showExamples: boolean;
  onFlip: () => void;
  onSpeak: () => void;
}

export function FlashcardDeck({ word, flipped, showIpa, showExamples, onFlip, onSpeak }: FlashcardDeckProps) {
  if (!word) return null;

  const level = getFlashcardLevel(word);
  const pos = getPartOfSpeechLabel(word.part_of_speech);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_38%)] blur-2xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <motion.div
          className="relative h-[min(68vh,34rem)] min-h-[24rem] w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.9 }}
          onClick={onFlip}
        >
          <section className="absolute inset-0 flex h-full w-full flex-col p-5 sm:p-7" style={{ backfaceVisibility: "hidden" }}>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", getLevelBadgeClass(level))}>
                Lv{level}
              </Badge>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tap to flip
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center px-2">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  {word.word}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {showIpa && word.ipa && (
                    <span className="rounded-full border border-border bg-muted/25 px-4 py-1.5 font-mono text-sm text-muted-foreground">
                      {word.ipa}
                    </span>
                  )}
                  {pos && (
                    <span className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-semibold capitalize text-foreground">
                      {pos}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak();
                  }}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Volume2 />
                </Button>
                <span>Press Enter or tap the card to reveal the meaning</span>
              </div>
            </div>
          </section>

          <section className="absolute inset-0 flex h-full w-full flex-col p-5 sm:p-7" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", getLevelBadgeClass(level))}>
                Lv{level}
              </Badge>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tap to flip back
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-hidden px-2 pt-4 sm:px-6">
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Meaning</p>
                <p className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">{word.meaning}</p>
              </div>

              <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Example</p>
                  {showExamples && word.example ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-base leading-relaxed text-foreground/95 sm:text-lg">
                        “{word.example}”
                      </p>
                      {word.example_translation && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {word.example_translation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-5 text-sm text-muted-foreground">
                      {showExamples ? "No example available for this card." : "Examples are hidden in settings."}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Synonyms</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {word.synonyms?.length ? (
                        word.synonyms.map((synonym) => (
                          <span key={synonym} className="rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-foreground">
                            {synonym}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No synonyms listed.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
