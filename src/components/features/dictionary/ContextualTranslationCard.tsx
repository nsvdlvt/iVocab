"use client";

import React, { useState } from "react";
import { Sparkles, Bookmark, Loader2, MessageSquareQuote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ContextualTranslationResult } from "@/types/dictionary";
import { SaveWordModal } from "./SaveWordModal";

interface ContextualTranslationCardProps {
  initialWord?: string;
  initialSentence?: string;
  onSaved?: () => void;
  className?: string;
}

export function ContextualTranslationCard({
  initialWord = "",
  initialSentence = "",
  className,
}: ContextualTranslationCardProps) {
  const [word, setWord] = useState(initialWord);
  const [sentence, setSentence] = useState(initialSentence);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContextualTranslationResult | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleTranslate = async () => {
    const cleanWord = word.trim();
    const cleanSentence = sentence.trim();

    if (!cleanWord) {
      toast.error("Vui lòng nhập từ hoặc cụm từ cần dịch.");
      return;
    }
    if (!cleanSentence) {
      toast.error("Vui lòng cung cấp câu chứa từ này để dịch theo ngữ cảnh.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/dictionary/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, sentence: cleanSentence }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể dịch theo ngữ cảnh.");
      }

      setResult(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi dịch theo ngữ cảnh.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden border-border/80 bg-card p-5 sm:p-6 rounded-3xl shadow-xs space-y-4 ${className || ""}`}>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <MessageSquareQuote className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Dịch từ vựng theo ngữ cảnh câu
          </h3>
          <p className="text-xs text-muted-foreground">
            Xác định chính xác nghĩa của từ trong câu cụ thể, phân biệt các nghĩa đa ngữ cảnh.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 space-y-1">
            <span className="text-xs font-semibold text-foreground">Từ / Cụm từ cần dịch:</span>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. run"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <span className="text-xs font-semibold text-foreground">Câu văn chứa từ:</span>
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="e.g. She decided to run her own startup company."
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleTranslate}
            disabled={loading || !word.trim() || !sentence.trim()}
            className="rounded-xl font-bold gap-2 text-xs h-9 bg-primary text-primary-foreground shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Phân tích ngữ cảnh</span>
          </Button>
        </div>
      </div>

      {/* Contextual Translation Result Card */}
      {result && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{result.word}</span>
                {result.detectedPos && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0">
                    {result.detectedPos}
                  </Badge>
                )}
              </div>
              <p className="text-base font-extrabold text-primary">
                Nghĩa trong câu: {result.selectedMeaningVi}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setSaveModalOpen(true)}
              className="rounded-xl font-bold text-xs h-8 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Lưu nghĩa này</span>
            </Button>
          </div>

          {result.explanationVi && (
            <div className="rounded-xl bg-background/80 p-3 text-xs text-foreground leading-relaxed border border-border/50">
              <span className="font-bold text-muted-foreground block mb-0.5">Giải thích ngữ cảnh:</span>
              {result.explanationVi}
            </div>
          )}

          {result.suggestedExampleEn && (
            <div className="space-y-1 pt-1 text-xs">
              <span className="font-semibold text-muted-foreground">Ví dụ tương tự:</span>
              <p className="italic text-foreground">&ldquo;{result.suggestedExampleEn}&rdquo;</p>
              {result.suggestedExampleVi && (
                <p className="text-muted-foreground">{result.suggestedExampleVi}</p>
              )}
            </div>
          )}
        </div>
      )}

      {result && (
        <SaveWordModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          initialData={{
            word: result.word,
            meaning: result.selectedMeaningVi,
            partOfSpeech: result.detectedPos || "noun",
            example: result.sentence,
            exampleTranslation: result.explanationVi,
          }}
        />
      )}
    </Card>
  );
}
