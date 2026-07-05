"use client";

import React, { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  partOfSpeech: string;
  example: string;
  synonyms: string;
  antonyms: string;
  note: string;
  example_translation: string;
}

interface VocabularyCardProps {
  index: number;
  item: VocabularyItem;
  onChangeField: (id: string, field: keyof VocabularyItem, value: string) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
  errors?: { word?: string; meaning?: string };
}

export function VocabularyCard({
  index,
  item,
  onChangeField,
  onRemove,
  isPending,
  errors,
}: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative p-4 border border-[#E5E7EB] dark:border-border/60 bg-card rounded-2xl shadow-xs hover:shadow-md hover:border-blue-500/30 transition-all duration-350 space-y-4"
    >
      {/* Index & Basic row control header */}
      <div className="flex justify-between items-center pb-2 border-b border-border/30">
        <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wider flex items-center gap-1.5 select-none">
          <span className="h-5 w-5 rounded-full bg-primary/5 text-primary flex items-center justify-center text-[10px] font-extrabold">
            {index + 1}
          </span>
          THẺ TỪ VỰNG
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu gọn chi tiết" : "Xem thêm chi tiết"}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer hover:bg-muted/65"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(item.id)}
            disabled={isPending}
            className="h-7 w-7 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
            title="Xóa thẻ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Grid: LEFT (always visible) vs RIGHT (always visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: Word, IPA, Example Sentence */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Từ vựng *</Label>
            <input
              type="text"
              placeholder="Ví dụ: ability, creative..."
              value={item.word}
              onChange={(e) => onChangeField(item.id, "word", e.target.value)}
              disabled={isPending}
              className={cn(
                "w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none",
                errors?.word && "ring-1 ring-rose-500 placeholder:text-rose-300"
              )}
            />
            {errors?.word && (
              <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errors.word}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Phiên âm (IPA)</Label>
            <input
              type="text"
              placeholder="Ví dụ: /əˈbɪl.ə.ti/..."
              value={item.ipa}
              onChange={(e) => onChangeField(item.id, "ipa", e.target.value)}
              disabled={isPending}
              className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Câu ví dụ (Tiếng Anh)</Label>
            <input
              type="text"
              placeholder="Ví dụ: Reading helps improve vocabulary..."
              value={item.example}
              onChange={(e) => onChangeField(item.id, "example", e.target.value)}
              disabled={isPending}
              className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Meaning, Part of Speech, Synonyms */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Ý nghĩa *</Label>
            <input
              type="text"
              placeholder="Ví dụ: khả năng, sự sáng tạo..."
              value={item.meaning}
              onChange={(e) => onChangeField(item.id, "meaning", e.target.value)}
              disabled={isPending}
              className={cn(
                "w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none",
                errors?.meaning && "ring-1 ring-rose-500 placeholder:text-rose-300"
              )}
            />
            {errors?.meaning && (
              <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errors.meaning}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Từ loại</Label>
            <input
              type="text"
              placeholder="Ví dụ: noun, verb, adjective, phrasal verb..."
              value={item.partOfSpeech}
              onChange={(e) => onChangeField(item.id, "partOfSpeech", e.target.value)}
              disabled={isPending}
              className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Từ đồng nghĩa</Label>
            <input
              type="text"
              placeholder="Ví dụ: skill, capacity..."
              value={item.synonyms}
              onChange={(e) => onChangeField(item.id, "synonyms", e.target.value)}
              disabled={isPending}
              className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Expanded properties: Antonyms, note, example_translation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-dashed border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Từ trái nghĩa</Label>
                <input
                  type="text"
                  placeholder="Ví dụ: inability..."
                  value={item.antonyms}
                  onChange={(e) => onChangeField(item.id, "antonyms", e.target.value)}
                  disabled={isPending}
                  className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Dịch câu ví dụ</Label>
                <input
                  type="text"
                  placeholder="Bản dịch nghĩa tiếng Việt..."
                  value={item.example_translation}
                  onChange={(e) => onChangeField(item.id, "example_translation", e.target.value)}
                  disabled={isPending}
                  className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">Ghi chú thêm</Label>
                <input
                  type="text"
                  placeholder="Mẹo nhớ từ, ngữ cảnh..."
                  value={item.note}
                  onChange={(e) => onChangeField(item.id, "note", e.target.value)}
                  disabled={isPending}
                  className="w-full h-8.5 px-3 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-xl border-0 text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:ring-1 focus:ring-primary/25 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
