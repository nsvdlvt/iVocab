"use client";

import React, { useMemo, useState } from "react";
import { Check, RotateCw, PartyPopper, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlashcardViewer } from "./FlashcardViewer";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface ReviewClientProps {
  words: VocabularyRow[];
  dueToday: number;
  masteredWords: number;
  learningWords: number;
}

export function ReviewClient({ words, dueToday, masteredWords, learningWords }: ReviewClientProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [remembered, setRemembered] = useState(0);
  const [answered, setAnswered] = useState(0);

  const total = words.length;
  const currentWord = words[currentIndex];
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const reviewLabel = useMemo(() => {
    if (total === 0) return "Không có bài ôn";
    return `${answered} / ${total}`;
  }, [answered, total]);

  const handleGrade = async (knew: boolean) => {
    if (!currentWord) return;

    void fetch("/api/srs/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vocabularyId: currentWord.id,
        mode: "review",
        answerResult: knew ? "correct" : "wrong",
      }),
    }).then(async (response) => {
      if (!response.ok) {
        console.error("SRS save failed (review)", await response.text());
      }
    }).catch((error) => {
      console.error("SRS save request failed (review)", error);
    });

    setAnswered((n) => n + 1);
    if (knew) setRemembered((n) => n + 1);

    if (currentIndex + 1 >= total) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Ôn tập hôm nay</h2>
              <p className="text-sm text-muted-foreground">
                Chỉ tải những từ đang đến hạn từ hàng đợi SRS hiện có.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="text-3xl font-extrabold text-primary">{dueToday}</div>
              <div className="text-xs text-muted-foreground">Cần ôn hôm nay</div>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{masteredWords}</div>
              <div className="text-xs text-muted-foreground">Từ đã thuộc</div>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{learningWords}</div>
              <div className="text-xs text-muted-foreground">Từ đang học</div>
            </div>
          </div>

          {total > 0 ? (
            <Button onClick={() => setStarted(true)} className="h-11 rounded-xl px-6 gap-2">
              Bắt đầu ôn
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
              <p className="text-lg font-bold">🎉 Tuyệt vời!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bạn đã hoàn thành hết các bài ôn đã lên lịch hôm nay.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <div className="rounded-3xl border bg-card p-10 shadow-sm space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <PartyPopper className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">Ôn tập hoàn tất</h2>
            <p className="text-sm text-muted-foreground mt-2">Bạn đã ôn xong toàn bộ các từ đã lên lịch.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{remembered}</div>
              <p className="text-xs text-muted-foreground">Từ nhớ được</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-2xl font-extrabold text-foreground">{total}</div>
              <p className="text-xs text-muted-foreground">Từ đã ôn hôm nay</p>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl gap-2">
            <RotateCw className="h-4 w-4" />
            Ôn lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Tiến trình ôn</span>
          <span>{reviewLabel}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 rounded-full" />
      </div>

      {currentWord && <FlashcardViewer word={currentWord} />}

      <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl mx-auto">
        <Button
          variant="outline"
          onClick={() => handleGrade(false)}
          className="rounded-xl border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <X className="h-4 w-4" />
          Chưa nhớ
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGrade(true)}
          className="rounded-xl border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 gap-2 px-6 h-11 font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Check className="h-4 w-4" />
          Nhớ rồi
        </Button>
      </div>
    </div>
  );
}
