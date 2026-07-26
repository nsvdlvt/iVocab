"use client";

import React from "react";
import { Database } from "@/types/database";
import { VocabSetCard } from "./VocabSetCard";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabSetGridProps {
  sets: VocabSetRow[];
  summaries?: Record<string, VocabSetProgressSummary>;
  onEdit: (set: VocabSetRow) => void;
  onDelete: (set: VocabSetRow, isPermanent: boolean) => void;
  onRestore: (set: VocabSetRow) => void;
}

export function VocabSetGrid({ sets, summaries, onEdit, onDelete, onRestore }: VocabSetGridProps) {
  return (
    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {sets.map((set) => (
        <VocabSetCard
          key={set.id}
          set={set}
          summary={summaries?.[set.id] ?? null}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
