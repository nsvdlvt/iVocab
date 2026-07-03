"use client";

import React, { useState } from "react";
import { Check, X, RotateCw, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlashcardViewer } from "./FlashcardViewer";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface ReviewClientProps {
  words: VocabularyRow[];
}

export function ReviewClient({ words }: ReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const total = words.length;
  const progressPercent = Math.round((currentIndex / total) * 100);

  const handleGrade = (knew: boolean) => {
    if (knew) setRemembered((n) => n + 1);
    if (currentIndex + 1 >= total) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (completed) {
    const accuracy = Math.round((remembered / total) * 100);
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-10 border border-border rounded-2xl px-8 bg-card shadow-sm">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-4">
            <PartyPopper className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-foreground">Hoàn thành!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Bạn đã ôn tập xong {total} từ hôm nay.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-4">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{remembered}</div>
            <p className="text-xs text-muted-foreground">Đã thuộc</p>
          </div>
          <div className="rounded-xl bg-rose-500/10 p-4">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{total - remembered}</div>
            <p className="text-xs text-muted-foreground">Chưa thuộc</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-primary">{accuracy}% chính xác</p>
        <Button
          onClick={() => {
            setCurrentIndex(0);
            setCompleted(false);
            setRemembered(0);
          }}
          className="rounded-xl cursor-pointer"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Ôn tập lại
        </Button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Tiến trình ôn tập</span>
          <span>{currentIndex + 1} / {total} từ</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 rounded-full" />
      </div>

      {/* Flashcard */}
      <FlashcardViewer word={currentWord} />

      {/* Grade controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl mx-auto">
        <Button
          variant="outline"
          onClick={() => handleGrade(false)}
          className="rounded-xl border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <X className="h-4 w-4" />
          Chưa thuộc
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            // Same as "not known" but advances card
            if (currentIndex + 1 >= total) setCompleted(true);
            else setCurrentIndex((i) => i + 1);
          }}
          className="rounded-xl gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 bg-muted/60 text-muted-foreground hover:bg-muted"
        >
          <RotateCw className="h-4 w-4" />
          Bỏ qua
        </Button>

        <Button
          variant="outline"
          onClick={() => handleGrade(true)}
          className="rounded-xl border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Check className="h-4 w-4" />
          Đã thuộc
        </Button>
      </div>
    </div>
  );
}
