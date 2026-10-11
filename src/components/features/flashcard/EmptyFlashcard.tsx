"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle } from "lucide-react";

interface EmptyFlashcardProps {
  onBack: () => void;
  onAddWords?: () => void;
  readOnly?: boolean;
}

export function EmptyFlashcard({ onBack, onAddWords, readOnly = false }: EmptyFlashcardProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <BookOpen className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-foreground">Chưa có thẻ từ vựng</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Hãy thêm từ vựng vào bộ từ này trước khi bắt đầu luyện tập với Flashcard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        {onAddWords && !readOnly && (
          <Button onClick={onAddWords}>
            <PlusCircle className="h-4 w-4" />
            <span>Thêm từ vựng</span>
          </Button>
        )}
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    </div>
  );
}
