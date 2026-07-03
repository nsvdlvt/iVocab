"use client";

import React, { useState } from "react";
import { Volume2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";

interface FlashcardViewerProps {
  word: VocabularyWord;
}

export function FlashcardViewer({ word }: FlashcardViewerProps) {
  const [showBack, setShowBack] = useState(false);

  const getPartOfSpeechLabel = (pos: VocabularyWord["partOfSpeech"]) => {
    const labels: Record<string, string> = {
      noun: "danh từ",
      verb: "động từ",
      adjective: "tính từ",
      adverb: "trạng từ",
    };
    return labels[pos] || pos;
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Front/Back control tabs */}
      <div className="flex justify-center gap-2">
        <Button
          variant={!showBack ? "default" : "outline"}
          onClick={() => setShowBack(false)}
          className="rounded-xl px-6 cursor-pointer"
        >
          Mặt trước (Từ vựng)
        </Button>
        <Button
          variant={showBack ? "default" : "outline"}
          onClick={() => setShowBack(true)}
          className="rounded-xl px-6 cursor-pointer"
        >
          Mặt sau (Giải nghĩa)
        </Button>
      </div>

      {/* Flashcard Shell */}
      <SectionCard className="h-96 flex flex-col justify-between items-center text-center p-8 bg-card relative shadow-md select-none border-border">
        {/* Top metadata */}
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
          <span>Gợi ý: Click các tab trên để đổi mặt thẻ</span>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none capitalize font-semibold rounded-lg px-2.5 py-0.5">
            {getPartOfSpeechLabel(word.partOfSpeech)}
          </Badge>
        </div>

        {/* Content Area */}
        <div className="my-auto space-y-6 w-full">
          {!showBack ? (
            /* Front side */
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
                {word.word}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base text-muted-foreground">{word.ipa}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 cursor-pointer" title="Phát âm (Giả lập)">
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Back side */
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Ý NGHĨA</p>
                <p className="text-2xl font-bold text-foreground">{word.definition}</p>
              </div>
              <div className="border-t border-border pt-4 space-y-2 max-w-md mx-auto text-left">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">VÍ DỤ</p>
                <p className="text-sm font-medium italic text-foreground/90 leading-relaxed">&ldquo;{word.example}&rdquo;</p>
                <p className="text-xs text-muted-foreground">{word.exampleTranslation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom context hint */}
        <div className="w-full flex justify-center items-center text-xs text-muted-foreground">
          <HelpCircle className="h-4 w-4 mr-1 text-muted-foreground/60" />
          <span>Chọn độ ghi nhớ của bạn bằng các nút điều khiển phía dưới</span>
        </div>
      </SectionCard>
    </div>
  );
}
