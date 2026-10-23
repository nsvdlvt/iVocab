import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ETeamVocabSetDetailLoading() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Skeleton className="h-8 w-44 rounded-lg" />

      {/* Header Card Skeleton */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-7 w-64 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>

        <div className="pt-4 border-t border-border/70 space-y-3">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Study Modes Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Word Table Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44 rounded-md" />
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
