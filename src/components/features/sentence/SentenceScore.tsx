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
        {/* Simple circular score using CSS - fallback if no Circle component */}
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path
              className="text-gray-200"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
            <path
              className="text-primary"
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${overallScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
            <text x="18" y="20.35" className="fill-current text-sm" textAnchor="middle">
              {overallScore}%
            </text>
          </svg>
        </div>
      </div>
      {categoryScores && (
        <div className="space-y-2">
          {Object.entries(categoryScores).map(([cat, val]) => (
            <div key={cat} className="flex items-center space-x-2">
              <span className="w-24 capitalize">{cat}</span>
              <Progress value={val} className="flex-1" />
              <span className="w-12 text-right">{val}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
