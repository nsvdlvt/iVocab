// src/components/features/sentence/SentenceScore.tsx
"use client";

// import { Circle } from "@/components/ui/circle"; // removed: not used
import { Progress } from "@/components/ui/progress";

/**
 * Minimal score visualization.
 * overallScore: 0-100
 * categoryScores: optional map of category name to 0-100 score.
 */
export interface ScoreProps {
  overallScore: number;
  // e.g., { grammar: 80, vocabulary: 90 }
  categoryScores?: Record<string, number>;
}

export function SentenceScore({ overallScore, categoryScores }: ScoreProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              className="text-muted"
              fill="none"
              strokeWidth="3"
              stroke="currentColor"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
            <path
              className="text-primary"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              strokeDasharray={`${overallScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-foreground">{overallScore}%</span>
          </div>
        </div>
      </div>
      {categoryScores && (
        <div className="space-y-2.5">
          {Object.entries(categoryScores).map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-3 text-xs">
              <span className="w-24 capitalize font-medium text-muted-foreground">{cat}</span>
              <Progress value={val} className="flex-1 h-2" />
              <span className="w-10 text-right font-semibold tabular-nums text-foreground">{val}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
