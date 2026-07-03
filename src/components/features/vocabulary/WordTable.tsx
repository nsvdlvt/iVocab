"use client";

import React from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";

interface WordTableProps {
  words: VocabularyWord[];
}

export function WordTable({ words }: WordTableProps) {
  const getStatusBadge = (status: VocabularyWord["status"]) => {
    switch (status) {
      case "mastered":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 rounded-lg text-[10px] font-bold">Đã thuộc</Badge>;
      case "learning":
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20 rounded-lg text-[10px] font-bold">Đang học</Badge>;
      case "new":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 rounded-lg text-[10px] font-bold">Từ mới</Badge>;
      default:
        return null;
    }
  };

  const getPartOfSpeechLabel = (pos: VocabularyWord["partOfSpeech"]) => {
    const labels: Record<string, string> = {
      noun: "danh từ",
      verb: "động từ",
      adjective: "tính từ",
      adverb: "trạng từ",
      preposition: "giới từ",
      conjunction: "liên từ",
      pronoun: "đại từ",
      interjection: "thán từ",
    };
    return labels[pos] || pos;
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
            <th className="px-6 py-4 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {words.map((w) => (
            <tr key={w.id} className="hover:bg-muted/10 transition-all duration-200">
              <td className="px-6 py-4">
                <span className="font-bold text-foreground text-base">{w.word}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs text-muted-foreground">{w.ipa}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                    {getPartOfSpeechLabel(w.partOfSpeech)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-foreground">{w.definition}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5 max-w-sm">
                  <span className="text-xs italic text-foreground/90">&ldquo;{w.example}&rdquo;</span>
                  <span className="text-[11px] text-muted-foreground">{w.exampleTranslation}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {getStatusBadge(w.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
