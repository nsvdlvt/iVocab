"use client";

import React, { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Check, AlertCircle, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { AIVocabItem } from "@/lib/ai/import-vocabulary";
import { cn } from "@/lib/utils";

interface AIImportPreviewProps {
  items: AIVocabItem[];
  existingWords: Array<{ word: string; meaning: string }>;
  onImport: (itemsToImport: AIVocabItem[]) => void;
  onCancel: () => void;
}

export function AIImportPreview({
  items,
  onImport,
  onCancel,
}: AIImportPreviewProps) {
  const [vocabList, setVocabList] = useState<AIVocabItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(items.map((_, idx) => idx))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<keyof AIVocabItem | null>(
    null
  );
  const [editValue, setEditValue] = useState("");

  const stats = useMemo(() => {
    const total = vocabList.length;
    const selected = selectedIds.size;
    return { total, selected, newWords: total };
  }, [vocabList.length, selectedIds]);

  const handleCheckboxToggle = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () =>
    setSelectedIds(new Set(vocabList.map((_, idx) => idx)));
  const handleDeselectAll = () => setSelectedIds(new Set());

  const handleDeleteSelected = () => {
    const nextList = vocabList.filter((_, idx) => !selectedIds.has(idx));
    setVocabList(nextList);
    setSelectedIds(new Set());
    toast.success("Đã xóa các mục từ vựng được chọn.");
  };

  const handleInlineEditStart = (
    index: number,
    field: keyof AIVocabItem,
    val: string
  ) => {
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden select-none">
      {/* KPI Bar */}
      <div className="mb-3.5 grid shrink-0 grid-cols-2 gap-2.5 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs sm:grid-cols-4">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tổng số từ
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {stats.total}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Từ mới
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.newWords}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Đã chọn
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-primary">
            {stats.selected} /{" "}
            <span className="text-muted-foreground">{stats.total}</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hiển thị
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {filteredAndSortedList.length}
          </p>
        </div>
      </div>

      {/* Filter & Bulk Actions */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2.5">
        <div className="relative w-full max-w-xs sm:w-auto flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm theo từ, nghĩa, từ loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-lg pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleSelectAll}
          >
            Chọn tất cả
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleDeselectAll}
          >
            Bỏ chọn
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Xóa các từ đã chọn"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview List */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {filteredAndSortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground select-none">
            <AlertCircle className="mb-2 h-7 w-7 opacity-40" />
            <p className="text-xs font-medium">Không tìm thấy từ vựng nào.</p>
          </div>
        ) : (
          filteredAndSortedList.map(({ item, originalIndex }) => {
            const isChecked = selectedIds.has(originalIndex);

            return (
              <div
                key={originalIndex}
                className={cn(
                  "group/card relative flex flex-col gap-3 rounded-xl border bg-card p-3.5 transition-all duration-150 hover:border-primary/35",
                  isChecked
                    ? "border-border/80 shadow-2xs"
                    : "border-border/40 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() =>
                        handleCheckboxToggle(originalIndex)
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {editingIndex === originalIndex &&
                      editingField === "word" ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInlineEditSave(originalIndex, "word")
                            }
                            className="rounded-md p-1 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary cursor-pointer"
                          onClick={() =>
                            handleInlineEditStart(
                              originalIndex,
                              "word",
                              item.word
                            )
                          }
                          title="Nhấn để chỉnh sửa"
                        >
                          {item.word}
                          <Edit3 className="h-3 w-3 opacity-0 group-hover/card:opacity-50" />
                        </span>
                      )}

                      {editingIndex === originalIndex &&
                      editingField === "ipa" ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 w-28 rounded-md border border-input bg-background px-2 font-mono text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInlineEditSave(originalIndex, "ipa")
                            }
                            className="rounded-md p-1 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="font-mono text-xs text-muted-foreground hover:underline cursor-pointer"
                          onClick={() =>
                            handleInlineEditStart(
                              originalIndex,
                              "ipa",
                              item.ipa || ""
                            )
                          }
                        >
                          {item.ipa || "/.../"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {editingIndex === originalIndex &&
                    editingField === "partOfSpeech" ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 w-24 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineEditSave(originalIndex, "partOfSpeech")
                          }
                          className="rounded-md p-0.5 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          handleInlineEditStart(
                            originalIndex,
                            "partOfSpeech",
                            item.partOfSpeech || ""
                          )
                        }
                      >
                        {item.partOfSpeech || "Chưa phân loại"}
                      </Badge>
                    )}

                    {item.topic && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.topic}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Nghĩa tiếng Việt
                    </span>
                    {editingIndex === originalIndex &&
                    editingField === "meaning" ? (
                      <div className="flex w-full items-center gap-1">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineEditSave(originalIndex, "meaning")
                          }
                          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="font-semibold text-foreground hover:underline cursor-pointer"
                        onClick={() =>
                          handleInlineEditStart(
                            originalIndex,
                            "meaning",
                            item.meaning
                          )
                        }
                      >
                        {item.meaning}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Câu ví dụ
                    </span>
                    {editingIndex === originalIndex &&
                    editingField === "exampleSentence" ? (
                      <div className="flex w-full items-center gap-1">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineEditSave(
                              originalIndex,
                              "exampleSentence"
                            )
                          }
                          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="italic text-muted-foreground hover:underline cursor-pointer"
                        onClick={() =>
                          handleInlineEditStart(
                            originalIndex,
                            "exampleSentence",
                            item.exampleSentence || ""
                          )
                        }
                      >
                        {item.exampleSentence || "Chưa có ví dụ"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex shrink-0 items-center justify-between border-t border-border/80 pt-3.5 select-none">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Quay lại
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleImportSubmit}
          disabled={stats.selected === 0}
          className="font-semibold"
        >
          Thêm vào bộ từ vựng ({stats.selected})
        </Button>
      </div>
    </div>
  );
}
