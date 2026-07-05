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
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="flex items-center space-x-2 mb-1">
        <span className="font-medium">Original:</span>
        <span className="text-gray-700">{original}</span>
      </div>
      {suggestion && (
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium">Suggestion:</span>
          <span className="text-blue-600">{suggestion}</span>
        </div>
      )}
      {explanation && (
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium">Explanation:</span>
          <span className="text-gray-500 text-sm">{explanation}</span>
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">
        Confidence: <span className="badge bg-primary/10 text-primary px-1 py-0.5 rounded">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
