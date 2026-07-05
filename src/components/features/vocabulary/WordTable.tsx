"use client";

import React from "react";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface WordTableProps {
  words: VocabularyRow[];
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "danh từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  preposition: "giới từ",
  conjunction: "liên từ",
  pronoun: "đại từ",
  interjection: "thán từ",
};

export function WordTable({ words }: WordTableProps) {
  const getPartOfSpeechLabel = (pos: string | null) => {
    if (!pos) return null;
    return PART_OF_SPEECH_LABELS[pos] ?? pos;
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
            <th className="px-6 py-4">Từ vựng</th>
            <th className="px-6 py-4">Phiên âm / Loại từ</th>
            <th className="px-6 py-4">Ý nghĩa</th>
            <th className="px-6 py-4">Ví dụ thực tế</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {words.map((w) => {
            const posLabel = getPartOfSpeechLabel(w.part_of_speech);
            return (
              <tr key={w.id} className="hover:bg-muted/10 transition-all duration-200">
                <td className="px-6 py-4">
                  <span className="font-bold text-foreground text-base">{w.word}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    {w.ipa && (
                      <span className="font-mono text-xs text-muted-foreground">{w.ipa}</span>
                    )}
                    {posLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                        {posLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-foreground">{w.meaning}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5 max-w-sm">
                    {w.example ? (
                      <span className="text-xs italic text-foreground/90">&ldquo;{w.example}&rdquo;</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Chưa có ví dụ</span>
                    )}
                    {w.example_translation && (
                      <span className="text-[11px] text-muted-foreground">{w.example_translation}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
