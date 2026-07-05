// src/components/features/vocabulary/AIImportPreview.tsx
"use client";

import React, { useState, useMemo, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Sparkles, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AIVocabItem, normalizeWord } from "@/lib/ai/import-vocabulary";
import { cn } from "@/lib/utils";

interface AIImportPreviewProps {
  items: AIVocabItem[];
  existingWords: Array<{ word: string; meaning: string }>;
  onImport: (itemsToImport: AIVocabItem[]) => void;
  onCancel: () => void;
}

export function AIImportPreview({ items, existingWords, onImport, onCancel }: AIImportPreviewProps) {
  const [vocabList, setVocabList] = useState<AIVocabItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(items.map((_, idx) => idx)));
  const [searchQuery, setSearchQuery] = useState("");
  const sortField = "word";
  const sortOrder = "asc";
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [isPendingEnrich, startEnrichTransition] = useTransition();

  // Normalized existing words for fast matching
  const normalizedExisting = useMemo(() => {
    return new Set(existingWords.map(w => normalizeWord(w.word)));
  }, [existingWords]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = vocabList.length;
    const selected = selectedIds.size;
    const deselected = total - selected;
    let duplicates = 0;
    
    // Check duplicates against current editor set
    vocabList.forEach((item) => {
      if (normalizedExisting.has(normalizeWord(item.word))) {
        duplicates++;
      }
    });

    const newWords = total - duplicates;

    return { total, selected, deselected, duplicates, newWords };
  }, [vocabList, selectedIds, normalizedExisting]);

  const handleCheckboxToggle = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(vocabList.map((_, idx) => idx)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const nextList = vocabList.filter((_, idx) => !selectedIds.has(idx));
    setVocabList(nextList);
    setSelectedIds(new Set());
    toast.success("Đã xóa các mục từ vựng được chọn.");
  };

  const handleInlineEditStart = (index: number, field: string, val: string) => {
    setEditingIndex(index);
    setEditingField(field);
    setEditValue(val);
  };

  const handleInlineEditSave = (index: number, field: keyof AIVocabItem) => {
    setVocabList((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: editValue };
        }
        return item;
      })
    );
    setEditingIndex(null);
    setEditingField(null);
  };

  // Optional AI Data Enrichment logic (Only sends missing fields)
  const handleBatchEnrich = () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một từ vựng để làm giàu dữ liệu.");
      return;
    }

    startEnrichTransition(async () => {
      try {
        const enrichedList = [...vocabList];
        const promises = Array.from(selectedIds).map(async (idx) => {
          const item = vocabList[idx];
          // Find missing fields
          const missingFields: string[] = [];
          const checkFields = [
            "ipa",
            "partOfSpeech",
            "exampleSentence",
            "exampleMeaning",
            "synonym",
            "antonym",
            "collocations",
            "level",
            "difficulty",
            "frequency",
            "topic",
            "wordFamily",
            "phonics",
            "exampleDifficulty",
            "note",
          ];
          
          checkFields.forEach((field) => {
            const val = item[field as keyof AIVocabItem];
            if (!val || (Array.isArray(val) && val.length === 0)) {
              missingFields.push(field);
            }
          });

          if (missingFields.length === 0) return;

          const res = await fetch("/api/ai/import/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item, missingFields }),
          });
          const responseData = await res.json();
          if (responseData.success) {
            enrichedList[idx] = {
              ...item,
              ...responseData.data,
            };
          }
        });

        await Promise.all(promises);
        setVocabList(enrichedList);
        toast.success("Đã làm giàu dữ liệu các từ vựng thành công!");
      } catch (err) {
        console.error(err);
        toast.error("Lỗi trong quá trình làm giàu dữ liệu.");
      }
    });
  };

  const handleImportSubmit = () => {
    if (selectedIds.size === 0) {
      toast.error("Không có từ vựng nào được chọn để thêm.");
      return;
    }
    const finalItems = vocabList.filter((_, idx) => selectedIds.has(idx));
    onImport(finalItems);
  };

  // Sort and filter logic
  const filteredAndSortedList = useMemo(() => {
    let result = vocabList.map((item, originalIndex) => ({ item, originalIndex }));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(({ item }) => {
        return (
          item.word.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q) ||
          (item.topic && item.topic.toLowerCase().includes(q)) ||
          (item.level && item.level.toLowerCase().includes(q))
        );
      });
    }

    result.sort((a, b) => {
      let valA = a.item[sortField] || "";
      let valB = b.item[sortField] || "";
      if (Array.isArray(valA)) valA = valA.join(", ");
      if (Array.isArray(valB)) valB = valB.join(", ");

      if (sortOrder === "asc") {
        return String(valA).localeCompare(String(valB));
      } else {
        return String(valB).localeCompare(String(valA));
      }
    });

    return result;
  }, [vocabList, searchQuery, sortField, sortOrder]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
      {/* STATS HEADER BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-3 rounded-2xl border border-border/40 mb-4 text-xs font-semibold shrink-0">
        <div className="text-center py-1">
          <p className="text-muted-foreground text-[10px]">TỔNG SỐ TỪ</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className="text-center py-1">
          <p className="text-muted-foreground text-[10px]">TỪ MỚI</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.newWords}</p>
        </div>
        <div className="text-center py-1">
          <p className="text-muted-foreground text-[10px]">TỪ TRÙNG LẶP</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.duplicates}</p>
        </div>
        <div className="text-center py-1">
          <p className="text-muted-foreground text-[10px]">ĐÃ CHỌN / BỎ CHỌN</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.selected} / <span className="text-muted-foreground">{stats.deselected}</span>
          </p>
        </div>
      </div>

      {/* SEARCH AND BATCH CONTROL TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Tìm theo từ, nghĩa, chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-xl border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleSelectAll}
            className="text-xs rounded-lg cursor-pointer hover:bg-muted/60"
          >
            Chọn tất cả
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleDeselectAll}
            className="text-xs rounded-lg cursor-pointer hover:bg-muted/60"
          >
            Bỏ chọn
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleBatchEnrich}
            disabled={isPendingEnrich}
            className="text-xs rounded-lg cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-500/5 font-bold gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {isPendingEnrich ? "Đang bổ sung..." : "Làm giàu dữ liệu"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleDeleteSelected}
            className="text-xs rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* SCROLLABLE LIST OF CARDS */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {filteredAndSortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground select-none">
            <AlertCircle className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-xs font-semibold">Không tìm thấy từ vựng nào.</p>
          </div>
        ) : (
          filteredAndSortedList.map(({ item, originalIndex }) => {
            const isDuplicate = normalizedExisting.has(normalizeWord(item.word));
            const isChecked = selectedIds.has(originalIndex);

            return (
              <div
                key={originalIndex}
                className={cn(
                  "p-4 border rounded-2xl relative transition-all duration-200 bg-card/60 flex flex-col gap-3 group/card hover:border-blue-500/30 hover:shadow-xs",
                  isChecked ? "border-border" : "border-border/30 opacity-70"
                )}
              >
                {/* Header row: Checkbox, Word, pronunciation, Original inflected, difficulty level, and badges */}
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-border/35">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleCheckboxToggle(originalIndex)}
                      className="rounded-[6px]"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {editingIndex === originalIndex && editingField === "word" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 w-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineEditSave(originalIndex, "word")}
                            className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                          onClick={() => handleInlineEditStart(originalIndex, "word", item.word)}
                        >
                          {item.word}
                        </span>
                      )}

                      {/* originalWord indicator (lemmatization) */}
                      {item.originalWord && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground font-medium select-none">
                          Gốc: {item.originalWord}
                        </span>
                      )}

                      {/* IPA Pronunciation */}
                      {editingIndex === originalIndex && editingField === "ipa" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 w-24"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineEditSave(originalIndex, "ipa")}
                            className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-[11px] text-muted-foreground font-mono cursor-pointer hover:underline"
                          onClick={() => handleInlineEditStart(originalIndex, "ipa", item.ipa || "")}
                        >
                          {item.ipa ? item.ipa : <span className="opacity-40 italic">Chưa có IPA</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata display badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.level && (
                      <Badge variant="outline" className="text-[9px] font-bold tracking-wide uppercase px-1.5 h-5 rounded-md bg-blue-500/5 text-blue-600 border-blue-500/10">
                        📈 {item.level}
                      </Badge>
                    )}
                    {item.topic && (
                      <Badge variant="outline" className="text-[9px] font-bold tracking-wide uppercase px-1.5 h-5 rounded-md bg-slate-500/5 text-slate-600 border-slate-500/10">
                        🏷 {item.topic}
                      </Badge>
                    )}
                    {isDuplicate && (
                      <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 select-none">
                        Đã tồn tại
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Row: Meaning, POS, example sentence & meaning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground/90">
                  {/* Left Column: POS, Meaning */}
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Từ loại</span>
                      {editingIndex === originalIndex && editingField === "partOfSpeech" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineEditSave(originalIndex, "partOfSpeech")}
                            className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-foreground font-semibold cursor-pointer hover:underline"
                          onClick={() => handleInlineEditStart(originalIndex, "partOfSpeech", item.partOfSpeech || "")}
                        >
                          {item.partOfSpeech ? item.partOfSpeech : <span className="opacity-40 italic">Chưa phân loại</span>}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Nghĩa tiếng Việt</span>
                      {editingIndex === originalIndex && editingField === "meaning" ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineEditSave(originalIndex, "meaning")}
                            className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-foreground font-bold text-[13px] cursor-pointer hover:underline"
                          onClick={() => handleInlineEditStart(originalIndex, "meaning", item.meaning)}
                        >
                          {item.meaning}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Example and Example translation */}
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Câu ví dụ (EN)</span>
                      {editingIndex === originalIndex && editingField === "exampleSentence" ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineEditSave(originalIndex, "exampleSentence")}
                            className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-foreground italic cursor-pointer hover:underline"
                          onClick={() => handleInlineEditStart(originalIndex, "exampleSentence", item.exampleSentence || "")}
                        >
                          {item.exampleSentence ? item.exampleSentence : <span className="opacity-40 italic">Chưa có ví dụ</span>}
                        </span>
                      )}
                    </div>

                    {item.exampleSentence && (
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Dịch nghĩa ví dụ (VI)</span>
                        {editingIndex === originalIndex && editingField === "exampleMeaning" ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineEditSave(originalIndex, "exampleMeaning")}
                              className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="text-foreground/80 cursor-pointer hover:underline block"
                            onClick={() => handleInlineEditStart(originalIndex, "exampleMeaning", item.exampleMeaning || "")}
                          >
                            {item.exampleMeaning ? item.exampleMeaning : <span className="opacity-40 italic">Chưa có dịch câu ví dụ</span>}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional detailed fields: Synonyms, Antonyms, Collocations */}
                <div className="pt-2 border-t border-dashed border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-semibold text-muted-foreground/75">
                  <div>
                    <span className="text-[9px] text-muted-foreground/50 block font-extrabold uppercase mb-0.5">Đồng nghĩa</span>
                    {editingIndex === originalIndex && editingField === "synonym" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none w-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineEditSave(originalIndex, "synonym")}
                          className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-foreground/90 cursor-pointer hover:underline"
                        onClick={() => handleInlineEditStart(originalIndex, "synonym", item.synonym || "")}
                      >
                        {item.synonym ? item.synonym : <span className="opacity-40 italic">-</span>}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-muted-foreground/50 block font-extrabold uppercase mb-0.5">Trái nghĩa</span>
                    {editingIndex === originalIndex && editingField === "antonym" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none w-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineEditSave(originalIndex, "antonym")}
                          className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-foreground/90 cursor-pointer hover:underline"
                        onClick={() => handleInlineEditStart(originalIndex, "antonym", item.antonym || "")}
                      >
                        {item.antonym ? item.antonym : <span className="opacity-40 italic">-</span>}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-muted-foreground/50 block font-extrabold uppercase mb-0.5">Cụm từ hay gặp</span>
                    {editingIndex === originalIndex && editingField === "collocations" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none w-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineEditSave(originalIndex, "collocations")}
                          className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-foreground/90 cursor-pointer hover:underline"
                        onClick={() => handleInlineEditStart(originalIndex, "collocations", item.collocations || "")}
                      >
                        {item.collocations ? item.collocations : <span className="opacity-40 italic">-</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="shrink-0 flex items-center justify-between pt-4 border-t border-border/30 mt-4 select-none">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          Trở lại
        </Button>

        <div className="flex items-center gap-3">
          {isConfirming ? (
            <div className="flex items-center gap-2 border border-border/80 bg-muted/20 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="text-[11px] text-foreground">
                Bạn sắp thêm {stats.selected} từ ({stats.duplicates} từ trùng, {stats.selected - stats.duplicates} từ mới)?
              </span>
              <Button
                type="button"
                onClick={handleImportSubmit}
                className="h-7 text-[10px] font-bold px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                Xác nhận
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfirming(false)}
                className="h-7 text-[10px] font-bold px-2 rounded-lg cursor-pointer"
              >
                Hủy
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setIsConfirming(true)}
              disabled={stats.selected === 0}
              className="rounded-xl h-9 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-98 transition-all flex items-center gap-1.5"
            >
              ➕ Thêm vào bộ từ vựng ({stats.selected})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
