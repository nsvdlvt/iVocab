import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ETeamLearnLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Main Flashcard Card Skeleton */}
      <div className="mx-auto max-w-xl space-y-4 pt-6">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <div className="flex justify-between items-center px-4">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
