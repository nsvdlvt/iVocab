"use client";

import React, { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AIVocabItem } from "@/lib/ai/import-vocabulary";
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<keyof AIVocabItem | null>(null);
  const [editValue, setEditValue] = useState("");

  const normalizeWord = (word: string) => word.trim().toLowerCase().normalize("NFC");

  const normalizedExisting = useMemo(() => new Set(existingWords.map((w) => normalizeWord(w.word))), [existingWords]);

  const duplicateState = useMemo(() => {
    const seen = new Set<string>();
    return vocabList.map((item) => {
      const key = normalizeWord(item.word);
      const isExistingDuplicate = normalizedExisting.has(key);
      const isBatchDuplicate = seen.has(key);
      seen.add(key);
      return {
        isDuplicate: isExistingDuplicate || isBatchDuplicate,
        isExistingDuplicate,
      };
    });
  }, [vocabList, normalizedExisting]);

  const stats = useMemo(() => {
    const total = vocabList.length;
    const selected = selectedIds.size;
    const duplicates = duplicateState.filter((item) => item.isDuplicate).length;
    return { total, selected, duplicates, newWords: total - duplicates };
  }, [vocabList.length, selectedIds, duplicateState]);

  const handleCheckboxToggle = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => setSelectedIds(new Set(vocabList.map((_, idx) => idx)));
  const handleDeselectAll = () => setSelectedIds(new Set());

  const handleDeleteSelected = () => {
    const nextList = vocabList.filter((_, idx) => !selectedIds.has(idx));
    setVocabList(nextList);
    setSelectedIds(new Set());
    toast.success("Đã xóa các mục từ vựng được chọn.");
  };

  const handleInlineEditStart = (index: number, field: keyof AIVocabItem, val: string) => {
    setEditingIndex(index);
    setEditingField(field);
    setEditValue(val);
  };

  const handleInlineEditSave = (index: number, field: keyof AIVocabItem) => {
    setVocabList((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "synonyms") {
          const values = editValue
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          return { ...item, synonyms: values };
        }
        return { ...item, [field]: editValue } as AIVocabItem;
      })
    );
    setEditingIndex(null);
    setEditingField(null);
  };

  const filteredAndSortedList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vocabList
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (!q) return true;
        return (
          item.word.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q) ||
          item.partOfSpeech.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.item.word.localeCompare(b.item.word));
  }, [vocabList, searchQuery]);

  const handleImportSubmit = () => {
    if (selectedIds.size === 0) {
      toast.error("Không có từ vựng nào được chọn để thêm.");
      return;
    }
    onImport(vocabList.filter((_, idx) => selectedIds.has(idx)));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
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
            {stats.selected} / <span className="text-muted-foreground">{stats.total - stats.selected}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Tìm theo từ, nghĩa, loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-xl border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="xs" onClick={handleSelectAll} className="text-xs rounded-lg cursor-pointer hover:bg-muted/60">
            Chọn tất cả
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={handleDeselectAll} className="text-xs rounded-lg cursor-pointer hover:bg-muted/60">
            Bỏ chọn
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={handleDeleteSelected} className="text-xs rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {filteredAndSortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground select-none">
            <AlertCircle className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-xs font-semibold">Không tìm thấy từ vựng nào.</p>
          </div>
        ) : (
          filteredAndSortedList.map(({ item, originalIndex }) => {
            const isDuplicate = duplicateState[originalIndex]?.isDuplicate;
            const isChecked = selectedIds.has(originalIndex);

            return (
              <div
                key={originalIndex}
                className={cn(
                  "p-4 border rounded-2xl relative transition-all duration-200 bg-card/60 flex flex-col gap-3 group/card hover:border-blue-500/30 hover:shadow-xs",
                  isChecked ? "border-border" : "border-border/30 opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-border/35">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onCheckedChange={() => handleCheckboxToggle(originalIndex)} className="rounded-[6px]" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {editingIndex === originalIndex && editingField === "word" ? (
                        <div className="flex items-center gap-1">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 w-32" />
                          <button type="button" onClick={() => handleInlineEditSave(originalIndex, "word")} className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-foreground text-sm cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "word", item.word)}>
                          {item.word}
                        </span>
                      )}

                      {isDuplicate && (
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 select-none">
                          {duplicateState[originalIndex]?.isExistingDuplicate ? "Đã tồn tại" : "Trùng trong lô"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.topic && (
                      <Badge variant="outline" className="text-[9px] font-bold tracking-wide uppercase px-1.5 h-5 rounded-md bg-slate-500/5 text-slate-600 border-slate-500/10">
                        🏷 {item.topic}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground/90">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Từ loại</span>
                      {editingIndex === originalIndex && editingField === "partOfSpeech" ? (
                        <div className="flex items-center gap-1">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-32" />
                          <button type="button" onClick={() => handleInlineEditSave(originalIndex, "partOfSpeech")} className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-foreground font-semibold cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "partOfSpeech", item.partOfSpeech || "")}>
                          {item.partOfSpeech ? item.partOfSpeech : <span className="opacity-40 italic">Chưa phân loại</span>}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Nghĩa tiếng Việt</span>
                      {editingIndex === originalIndex && editingField === "meaning" ? (
                        <div className="flex items-center gap-1 w-full">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-full" />
                          <button type="button" onClick={() => handleInlineEditSave(originalIndex, "meaning")} className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-foreground font-bold text-[13px] cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "meaning", item.meaning)}>
                          {item.meaning}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block uppercase font-bold tracking-wider mb-0.5">Câu ví dụ (EN)</span>
                      {editingIndex === originalIndex && editingField === "exampleSentence" ? (
                        <div className="flex items-center gap-1 w-full">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none w-full" />
                          <button type="button" onClick={() => handleInlineEditSave(originalIndex, "exampleSentence")} className="p-1 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-foreground italic cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "exampleSentence", item.exampleSentence || "")}>
                          {item.exampleSentence ? item.exampleSentence : <span className="opacity-40 italic">Chưa có ví dụ</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-semibold text-muted-foreground/75">
                  <div>
                    <span className="text-[9px] text-muted-foreground/50 block font-extrabold uppercase mb-0.5">Phiên âm</span>
                    {editingIndex === originalIndex && editingField === "ipa" ? (
                      <div className="flex items-center gap-1">
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none w-full" />
                        <button type="button" onClick={() => handleInlineEditSave(originalIndex, "ipa")} className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-foreground/90 cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "ipa", item.ipa || "")}>
                        {item.ipa ? item.ipa : <span className="opacity-40 italic">-</span>}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-muted-foreground/50 block font-extrabold uppercase mb-0.5">Đồng nghĩa</span>
                    {editingIndex === originalIndex && editingField === "synonyms" ? (
                      <div className="flex items-center gap-1">
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 px-2 text-[11px] bg-background border border-border rounded-lg focus:outline-none w-full" />
                        <button type="button" onClick={() => handleInlineEditSave(originalIndex, "synonyms")} className="p-0.5 text-emerald-600 rounded-lg hover:bg-emerald-500/5 cursor-pointer">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-foreground/90 cursor-pointer hover:underline" onClick={() => handleInlineEditStart(originalIndex, "synonyms", (item.synonyms || []).join(", "))}>
                        {item.synonyms.length ? item.synonyms.join(", ") : <span className="opacity-40 italic">-</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 flex items-center justify-between pt-4 border-t border-border/30 mt-4 select-none">
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer text-muted-foreground hover:text-foreground">
          Trở lại
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleImportSubmit}
            disabled={stats.selected === 0}
            className="rounded-xl h-9 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-98 transition-all flex items-center gap-1.5"
          >
            Thêm vào bộ từ vựng ({stats.selected})
          </Button>
        </div>
      </div>
    </div>
  );
}
