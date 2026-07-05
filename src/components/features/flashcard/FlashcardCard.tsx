"use client";

import React from "react";
import { Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database";
import { cn } from "@/lib/utils";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface FlashcardCardProps {
  word: VocabularyRow;
  isFlipped: boolean;
  onFlip: () => void;
  hideIpa: boolean;
  hideExample: boolean;
  onSpeak: (e: React.MouseEvent) => void;
}

export function FlashcardCard({
  word,
  isFlipped,
  onFlip,
  hideIpa,
  hideExample,
  onSpeak,
}: FlashcardCardProps) {
  return (
    <div
      onClick={onFlip}
      className="w-full max-w-xl mx-auto h-80 sm:h-96 cursor-pointer select-none perspective-[1200px]"
    >
      <div
        className={cn(
          "w-full h-full relative transition-transform duration-500 transform-style-3d shadow-md hover:shadow-lg border border-border/80 rounded-2xl bg-card",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* FRONT SIDE (Word details) */}
        <div className="absolute inset-0 w-full h-full backface-hidden p-6 sm:p-8 flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Mặt trước</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Bấm để lật
            </span>
          </div>

          <div className="my-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-snug px-4 line-clamp-3">
              {word.word}
            </h2>
            <div className="flex items-center justify-center gap-2">
              {word.ipa && !hideIpa && (
                <span className="font-mono text-sm sm:text-base text-muted-foreground">{word.ipa}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onSpeak}
                className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-500 hover:bg-indigo-500/5 cursor-pointer shrink-0"
                title="Phát âm"
              >
                <Volume2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          <div className="w-full text-[10px] text-muted-foreground font-semibold">
            Bàn phím: Dùng Space để lật thẻ
          </div>
        </div>

        {/* BACK SIDE (Definition details) */}
        <div className="absolute inset-0 w-full h-full backface-hidden p-6 sm:p-8 flex flex-col justify-between items-center text-center rotate-y-180">
          <div className="w-full flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Mặt sau</span>
            {word.part_of_speech && (
              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-none capitalize font-bold rounded-lg text-[9px] tracking-wide px-2 py-0.5 shrink-0">
                {word.part_of_speech}
              </Badge>
            )}
          </div>

          <div className="my-auto space-y-4 sm:space-y-6 w-full overflow-y-auto max-h-[70%] pr-1">
            <div className="space-y-1 sm:space-y-1.5">
              <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Ý NGHĨA</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-snug">{word.meaning}</p>
            </div>

            {word.example && !hideExample && (
              <div className="border-t border-border/40 pt-3 sm:pt-4 space-y-1.5 text-left max-w-md mx-auto">
                <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">VÍ DỤ</p>
                <p className="text-xs sm:text-sm font-medium italic text-foreground/90 leading-relaxed">
                  &ldquo;{word.example}&rdquo;
                </p>
                {word.example_translation && (
                  <p className="text-[11px] text-muted-foreground leading-normal">{word.example_translation}</p>
                )}
              </div>
            )}

            {word.synonyms && word.synonyms.length > 0 && (
              <div className="border-t border-border/40 pt-2.5 space-y-1 text-left max-w-md mx-auto">
                <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">ĐỒNG NGHĨA</p>
                <p className="text-xs text-muted-foreground truncate">{word.synonyms.join(", ")}</p>
              </div>
            )}
          </div>

          <div className="w-full text-[10px] text-muted-foreground font-semibold">
            Bấm thẻ để quay lại mặt trước
          </div>
        </div>
      </div>
    </div>
  );
}
