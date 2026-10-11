"use client";

import React, { memo, useState } from "react";
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
  onChangeField: (
    id: string,
    field: keyof VocabularyItem,
    value: string
  ) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
  errors?: { word?: string; meaning?: string };
}

const inputBaseClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/55 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

function VocabularyCardComponent({
  index,
  item,
  onChangeField,
  onRemove,
  isPending,
  errors,
}: VocabularyCardProps) {
  const hasAdvancedContent = Boolean(
    item.antonyms?.trim() ||
      item.example_translation?.trim() ||
      item.note?.trim()
  );
  const [isExpanded, setIsExpanded] = useState(hasAdvancedContent);
  const [draft, setDraft] = useState(() => ({
    word: item.word,
    meaning: item.meaning,
    ipa: item.ipa,
    partOfSpeech: item.partOfSpeech,
    example: item.example,
    synonyms: item.synonyms,
    antonyms: item.antonyms,
    note: item.note,
    example_translation: item.example_translation,
  }));
  // draft stays in sync via item.id key — callers must pass key={item.id} to VocabularyCard

  const handleFieldChange = (field: keyof VocabularyItem, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    onChangeField(item.id, field, value);
  };

  const hasErrors = Boolean(errors?.word || errors?.meaning);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(
        "group relative rounded-xl border bg-card p-4 sm:p-5 shadow-2xs transition-all duration-150 space-y-4 focus-within:border-primary/45 focus-within:shadow-sm",
        hasErrors ? "border-destructive/60" : "border-border/80"
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2 select-none">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/10 px-1.5 font-mono text-xs font-bold text-primary tabular-nums">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Thẻ từ vựng
          </span>
          {draft.word.trim() && (
            <span className="hidden sm:inline truncate max-w-[200px] text-xs font-medium text-foreground">
              • {draft.word.trim()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu gọn chi tiết" : "Mở rộng chi tiết"}
            className="h-7 gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {hasAdvancedContent && !isExpanded && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(item.id)}
            disabled={isPending}
            className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Xóa thẻ từ vựng"
            aria-label={`Xóa thẻ ${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Fields Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left Column: Word, IPA, Example */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Từ vựng <span className="text-destructive">*</span>
            </Label>
            <input
              type="text"
              placeholder="Ví dụ: resilient, elaborate..."
              value={draft.word}
              onChange={(e) => handleFieldChange("word", e.target.value)}
              disabled={isPending}
              className={cn(
                inputBaseClass,
                errors?.word &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
            />
            {errors?.word && (
              <p className="text-xs font-medium text-destructive">
                {errors.word}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Phiên âm (IPA)
            </Label>
            <input
              type="text"
              placeholder="Ví dụ: /rɪˈzɪl.i.ənt/"
              value={draft.ipa}
              onChange={(e) => handleFieldChange("ipa", e.target.value)}
              disabled={isPending}
              className={cn(inputBaseClass, "font-mono text-xs")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Câu ví dụ (Tiếng Anh)
            </Label>
            <input
              type="text"
              placeholder="Ví dụ: Reading daily helps expand your vocabulary."
              value={draft.example}
              onChange={(e) => handleFieldChange("example", e.target.value)}
              disabled={isPending}
              className={inputBaseClass}
            />
          </div>
        </div>

        {/* Right Column: Meaning, POS, Synonyms */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Ý nghĩa <span className="text-destructive">*</span>
            </Label>
            <input
              type="text"
              placeholder="Ví dụ: kiên cường, bền bỉ..."
              value={draft.meaning}
              onChange={(e) => handleFieldChange("meaning", e.target.value)}
              disabled={isPending}
              className={cn(
                inputBaseClass,
                errors?.meaning &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
            />
            {errors?.meaning && (
              <p className="text-xs font-medium text-destructive">
                {errors.meaning}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Từ loại
            </Label>
            <input
              type="text"
              list={`pos-suggestions-${item.id}`}
              placeholder="Ví dụ: noun, verb, adjective, adverb..."
              value={draft.partOfSpeech}
              onChange={(e) =>
                handleFieldChange("partOfSpeech", e.target.value)
              }
              disabled={isPending}
              className={inputBaseClass}
            />
            <datalist id={`pos-suggestions-${item.id}`}>
              <option value="noun" />
              <option value="verb" />
              <option value="adjective" />
              <option value="adverb" />
              <option value="phrasal verb" />
              <option value="idiom" />
              <option value="preposition" />
              <option value="conjunction" />
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Từ đồng nghĩa
            </Label>
            <input
              type="text"
              placeholder="Ví dụ: tough, adaptable, strong..."
              value={draft.synonyms}
              onChange={(e) => handleFieldChange("synonyms", e.target.value)}
              disabled={isPending}
              className={inputBaseClass}
            />
          </div>
        </div>
      </div>

      {/* Expandable Advanced Fields */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 border-t border-dashed border-border/70 pt-3.5 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Từ trái nghĩa
                </Label>
                <input
                  type="text"
                  placeholder="Ví dụ: fragile, weak..."
                  value={draft.antonyms}
                  onChange={(e) =>
                    handleFieldChange("antonyms", e.target.value)
                  }
                  disabled={isPending}
                  className={inputBaseClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Dịch câu ví dụ
                </Label>
                <input
                  type="text"
                  placeholder="Bản dịch tiếng Việt cho câu ví dụ..."
                  value={draft.example_translation}
                  onChange={(e) =>
                    handleFieldChange("example_translation", e.target.value)
                  }
                  disabled={isPending}
                  className={inputBaseClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Ghi chú học tập
                </Label>
                <input
                  type="text"
                  placeholder="Mẹo ghi nhớ, collocation, ngữ cảnh..."
                  value={draft.note}
                  onChange={(e) => handleFieldChange("note", e.target.value)}
                  disabled={isPending}
                  className={inputBaseClass}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const VocabularyCard = memo(VocabularyCardComponent);
