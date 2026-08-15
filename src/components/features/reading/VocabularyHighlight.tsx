"use client";

import React from "react";
import { Volume2, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HighlightedWord } from "./reading-types";

export function VocabularyHighlight({
  word,
  onClose,
}: {
  word: HighlightedWord;
  onClose: () => void;
}) {
  return (
    <Card className="w-[min(22rem,calc(100vw-1.5rem))] border-border/70 bg-card/95 p-4 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-foreground">{word.text}</div>
          <div className="mt-1 text-sm text-muted-foreground">{word.ipa ?? "IPA chưa có"}</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
          Đóng
        </button>
      </div>
      <div className="mt-3 grid gap-2 text-sm">
        <div><span className="text-muted-foreground">Nghĩa: </span>{word.meaning ?? "Chưa có nghĩa"}</div>
        <div><span className="text-muted-foreground">Từ loại: </span>{word.partOfSpeech ?? "Chưa xác định"}</div>
        {word.example ? <div><span className="text-muted-foreground">Ví dụ: </span>{word.example}</div> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline"><Volume2 className="h-4 w-4" /> Phát âm</Button>
        <Button size="sm" variant="outline"><Star className="h-4 w-4" /> Đánh dấu sao</Button>
        <Button size="sm"><Plus className="h-4 w-4" /> Thêm vào bộ từ</Button>
      </div>
    </Card>
  );
}

export function highlightClassName(color?: string) {
  return cn(
    "rounded-md px-1 py-0.5 transition-colors cursor-pointer ring-offset-background hover:ring-2 hover:ring-foreground/10",
    color ?? "bg-amber-100/80 text-foreground"
  );
}
