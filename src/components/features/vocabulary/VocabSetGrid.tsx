"use client";

import React from "react";
import { Database } from "@/types/database";
import { VocabSetCard } from "./VocabSetCard";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabSetGridProps {
  sets: VocabSetRow[];
  onEdit: (set: VocabSetRow) => void;
  onDelete: (set: VocabSetRow, isPermanent: boolean) => void;
  onRestore: (set: VocabSetRow) => void;
}

export function VocabSetGrid({ sets, onEdit, onDelete, onRestore }: VocabSetGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => (
        <VocabSetCard
          key={set.id}
          set={set}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
