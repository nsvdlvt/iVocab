// src/components/features/sentence/MistakeCard.tsx
"use client";

import { SentenceFeedback } from "@/lib/ai/schemas/sentence-feedback";

/**
 * Card displaying a single mistake with original text, suggested correction, explanation and confidence badge.
 */
export function MistakeCard({ mistake }: { mistake: SentenceFeedback["mistakes"][number] }) {
  const { type, confidence } = mistake;
  // Assuming `type` contains a description like "Original -> Suggestion : Explanation"
  // For better UX we split by "->" if present.
  const parts = type.split("->").map((p) => p.trim());
  const original = parts[0] ?? "";
  const suggestion = parts[1] ?? "";
  const explanation = parts[2] ?? "";

  return (
    <div className="border border-border/80 rounded-xl p-4 bg-card text-card-foreground shadow-xs space-y-1.5">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-muted-foreground shrink-0">Original:</span>
        <span className="text-foreground line-through decoration-rose-500/60">{original}</span>
      </div>
      {suggestion && (
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-semibold text-muted-foreground shrink-0">Suggestion:</span>
          <span className="font-semibold text-primary">{suggestion}</span>
        </div>
      )}
      {explanation && (
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-semibold text-muted-foreground shrink-0">Explanation:</span>
          <span className="text-muted-foreground">{explanation}</span>
        </div>
      )}
      <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
        <span>Confidence:</span>
        <span className="inline-flex items-center bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-md">
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
