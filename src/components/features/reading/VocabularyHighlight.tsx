"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Volume2, Bookmark, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import { cn } from "@/lib/utils";
import { EASING } from "@/lib/motion";
import type { HighlightedWord } from "./reading-types";
import { SaveWordModal } from "@/components/features/dictionary/SaveWordModal";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

export function VocabularyHighlight({
  word,
  onClose,
}: {
  word: HighlightedWord;
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 6 }}
        transition={{ duration: 0.22, ease: EASING.spring }}
      >
        <Card className="w-[min(24rem,calc(100vw-1.5rem))] border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-md overflow-hidden relative rounded-3xl">
          {/* Subtle decorative glow */}
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/10 blur-xl"
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-3 relative">
            <div className="flex items-center gap-3">
              <BeeMascot state="reading" size="xs" interactive={false} />
              <div>
                <div className="text-lg font-bold tracking-tight text-foreground">
                  {word.text}
                </div>
                <div className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                  {word.ipa ?? "/.../"}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-full"
              aria-label="Đóng thẻ từ"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3.5 space-y-2 text-sm">
            <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                Nghĩa từ vựng:
              </span>
              <span className="font-bold text-foreground text-sm">
                {word.meaning ?? "Chưa có nghĩa"}
              </span>
            </div>

            {word.partOfSpeech && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold">Từ loại: </span>
                <span className="inline-block rounded-md bg-secondary px-2 py-0.5 font-bold uppercase text-[10px] text-foreground">
                  {word.partOfSpeech}
                </span>
              </div>
            )}

            {(word.example || word.exampleTranslation || word.example_translation) && (
              <div className="text-xs leading-relaxed bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                  Ví dụ trong bài đọc:
                </span>
                {word.example && (
                  <p className="italic text-foreground/90">
                    &ldquo;
                    <HighlightedSentence
                      sentence={word.example}
                      type="en"
                      targetWord={word.text}
                    />
                    &rdquo;
                  </p>
                )}
                {(word.exampleTranslation || word.example_translation) && (
                  <p className="mt-1 text-[11px] text-muted-foreground not-italic">
                    <HighlightedSentence
                      sentence={(word.exampleTranslation || word.example_translation)!}
                      type="vi"
                      meaning={word.meaning}
                    />
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeak}
              className="rounded-xl text-xs h-8 gap-1.5 flex-1"
            >
              <Volume2 className={cn("h-3.5 w-3.5 text-primary", isPlaying && "animate-pulse text-amber-500")} />
              <span>{isPlaying ? "Đang phát..." : "Phát âm"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setSaveModalOpen(true)}
              className="rounded-xl text-xs h-8 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Lưu từ</span>
            </Button>

            <Link
              href={`/dictionary?q=${encodeURIComponent(word.text)}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl text-xs h-8 px-2.5 border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Tra cứu từ điển chuyên sâu"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </motion.div>

      <SaveWordModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        initialData={{
          word: word.text,
          meaning: word.meaning,
          partOfSpeech: word.partOfSpeech,
          ipa: word.ipa,
          example: word.example,
          exampleTranslation: word.exampleTranslation || word.example_translation,
        }}
      />
    </>
  );
}

export function highlightClassName(color?: string) {
  return cn(
    "rounded-md px-1 py-0.5 transition-colors cursor-pointer ring-offset-background hover:ring-2 hover:ring-foreground/10",
    color ?? "bg-amber-100/80 text-foreground"
  );
}
