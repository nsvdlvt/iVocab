import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DictionaryLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-96 rounded-xl" />
      </div>

      {/* Search Bar Skeleton */}
      <Skeleton className="h-14 w-full rounded-3xl" />

      {/* Card Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}
