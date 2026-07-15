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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-sm">
      <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-600">
        <BookOpen className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground">No cards yet</h2>
        <p className="text-sm text-muted-foreground">
          Add vocabulary to this set before starting flashcard study.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onAddWords && !readOnly && (
          <Button onClick={onAddWords} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add words
          </Button>
        )}
        <Button variant="outline" onClick={onBack} className="rounded-xl">
          Back
        </Button>
      </div>
    </div>
  );
}
