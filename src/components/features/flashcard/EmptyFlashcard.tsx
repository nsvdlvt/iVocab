"use client";

import React from "react";
import { Link2Off, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFlashcardProps {
  onBack: () => void;
  onAddWords: () => void;
}

export function EmptyFlashcard({ onBack, onAddWords }: EmptyFlashcardProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-border/80 rounded-2xl shadow-sm max-w-lg mx-auto space-y-5 my-12 select-none">
      <div className="rounded-full bg-muted/60 p-5">
        <Link2Off className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Bộ từ vựng trống</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          Bộ từ vựng này hiện chưa có từ vựng nào để bắt đầu phiên học Flashcard. Hãy thêm từ vựng mới trước nhé.
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl h-10 w-full sm:w-auto gap-1.5 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại bộ thẻ
        </Button>
        <Button
          onClick={onAddWords}
          className="rounded-xl h-10 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white cursor-pointer text-xs font-semibold"
        >
          Thêm từ vựng
        </Button>
      </div>
    </div>
  );
}
