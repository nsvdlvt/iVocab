"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  X,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  Trash2,
  ListChecks,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSpeak } from "@/hooks/use-speak";
import {
  type SelectableVocabSet,
  type SelectableVocabularyWord,
  deduplicateSelectedVocabulary,
  formatDifficultyLabel,
  MAX_WORDS_FOR_PERSONAL_TEST,
  MIN_WORDS_FOR_PERSONAL_TEST,
} from "@/lib/personal-test/vocabulary-selection";

type SortOption = "level_asc" | "recent_desc" | "recent_asc" | "alpha_asc" | "alpha_desc";

const SORT_LABELS: Record<SortOption, string> = {
  level_asc: "Ưu tiên level thấp (Lv0 → Lv5)",
  recent_desc: "Mới thêm gần đây",
  recent_asc: "Thêm cũ nhất",
  alpha_asc: "A đến Z",
  alpha_desc: "Z đến A",
};

const SRS_LEVEL_BADGE_STYLES: Record<number, string> = {
  0: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  1: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300",
  2: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  3: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
  4: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  5: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
};

const PAGE_SIZE = 30;

interface WordSelectionStepProps {
  selectedSets: SelectableVocabSet[];
  words: SelectableVocabularyWord[];
  selectedWordIds: Set<string>;
  onToggleWord: (wordId: string) => void;
  onSelectManyWords: (wordIds: string[]) => void;
  onDeselectManyWords: (wordIds: string[]) => void;
  onClearAllSelected: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function WordSelectionStep({
  selectedSets,
  words,
  selectedWordIds,
  onToggleWord,
  onSelectManyWords,
  onDeselectManyWords,
  onClearAllSelected,
  onBack,
  onContinue,
}: WordSelectionStepProps) {
  const { speakText } = useSpeak();

  const [searchQuery, setSearchQuery] = useState("");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [posFilter, setPosFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("level_asc");
  const [page, setPage] = useState(1);

  const [selectedPanelSearch, setSelectedPanelSearch] = useState("");

  // Available filter options derived strictly from actual DB values
  const availableLevels = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of words) {
      if (w.difficulty) {
        const label = formatDifficultyLabel(w.difficulty);
        if (label) map.set(label, label);
      }
    }
    return Array.from(map.values()).sort();
  }, [words]);

  const availablePos = useMemo(() => {
    const set = new Set<string>();
    for (const w of words) {
      const pos = w.part_of_speech?.trim();
      if (pos) set.add(pos);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [words]);

  // Filtered and sorted vocabulary list
  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = words.filter((w) => {
      if (setFilter !== "all" && w.set_id !== setFilter) return false;
      if (levelFilter !== "all") {
        const label = formatDifficultyLabel(w.difficulty);
        if (label !== levelFilter) return false;
      }
      if (posFilter !== "all") {
        if ((w.part_of_speech?.trim() ?? "") !== posFilter) return false;
      }
      if (q) {
        const matchesWord = w.word.toLowerCase().includes(q);
        const matchesMeaning = w.meaning.toLowerCase().includes(q);
        const matchesIpa = (w.ipa ?? "").toLowerCase().includes(q);
        if (!matchesWord && !matchesMeaning && !matchesIpa) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case "level_asc": {
          const lvlDiff = (a.srsLevel ?? 0) - (b.srsLevel ?? 0);
          if (lvlDiff !== 0) return lvlDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        case "alpha_asc":
          return a.word.localeCompare(b.word);
        case "alpha_desc":
          return b.word.localeCompare(a.word);
        case "recent_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "recent_desc":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return list;
  }, [words, setFilter, levelFilter, posFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageWords = filteredWords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Words currently belonging to the active set filter (for "Select all in set" / "Deselect all in set")
  const activeSetWords = useMemo(() => {
    if (setFilter === "all") return words;
    return words.filter((w) => w.set_id === setFilter);
  }, [words, setFilter]);

  const activeSetTitle = useMemo(() => {
    if (setFilter === "all") return "tất cả bộ đã chọn";
    return selectedSets.find((s) => s.id === setFilter)?.title ?? "bộ này";
  }, [setFilter, selectedSets]);

  // Selected records & deduplicated target words
  const selectedRecords = useMemo(
    () => words.filter((w) => selectedWordIds.has(w.id)),
    [words, selectedWordIds]
  );

  const deduplicatedTargets = useMemo(
    () => deduplicateSelectedVocabulary(selectedRecords),
    [selectedRecords]
  );

  const filteredSelectedRecords = useMemo(() => {
    const q = selectedPanelSearch.trim().toLowerCase();
    if (!q) return selectedRecords;
    return selectedRecords.filter(
      (r) =>
        r.word.toLowerCase().includes(q) ||
        r.meaning.toLowerCase().includes(q) ||
        r.set_title.toLowerCase().includes(q)
    );
  }, [selectedRecords, selectedPanelSearch]);

  const hasFilters = Boolean(
    searchQuery ||
      setFilter !== "all" ||
      levelFilter !== "all" ||
      posFilter !== "all"
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSetFilter("all");
    setLevelFilter("all");
    setPosFilter("all");
    setPage(1);
  };

  const uniqueCount = deduplicatedTargets.length;
  const remainingCapacity = Math.max(0, MAX_WORDS_FOR_PERSONAL_TEST - uniqueCount);
  const duplicateMergedCount = Math.max(0, selectedRecords.length - uniqueCount);
  const canContinue =
    uniqueCount >= MIN_WORDS_FOR_PERSONAL_TEST &&
    uniqueCount <= MAX_WORDS_FOR_PERSONAL_TEST;

  return (
    <div className="space-y-5">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 gap-1.5 rounded-xl text-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Chọn lại bộ từ</span>
          </Button>
          <div className="text-xs text-muted-foreground">
            Đang hiển thị từ{" "}
            <strong className="text-foreground">{selectedSets.length}</strong> bộ
            ({words.length} bản ghi)
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs font-medium text-muted-foreground tabular-nums">
            Đã chọn:{" "}
            <strong className="text-foreground font-bold">{uniqueCount}</strong>{" "}
            từ duy nhất
            {uniqueCount > MAX_WORDS_FOR_PERSONAL_TEST && (
              <span className="ml-1.5 text-destructive font-semibold">
                (Tối đa {MAX_WORDS_FOR_PERSONAL_TEST})
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            size="sm"
            className="h-9 gap-1.5 rounded-xl px-4 font-semibold cursor-pointer shadow-xs"
          >
            <span>Tiếp tục cấu hình</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Two-Column Selection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Vocabulary Browser, Filters & Checkboxes (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Filters Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm từ tiếng Anh, nghĩa tiếng Việt hoặc phiên âm..."
                  aria-label="Tìm kiếm từ vựng"
                  className="h-9 rounded-xl pl-9 pr-8 text-xs sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    aria-label="Xóa tìm kiếm từ vựng"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy((v ?? "level_asc") as SortOption)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[215px] rounded-xl text-xs font-medium">
                  <span className="truncate">{SORT_LABELS[sortBy]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level_asc">{SORT_LABELS.level_asc}</SelectItem>
                  <SelectItem value="recent_desc">{SORT_LABELS.recent_desc}</SelectItem>
                  <SelectItem value="recent_asc">{SORT_LABELS.recent_asc}</SelectItem>
                  <SelectItem value="alpha_asc">{SORT_LABELS.alpha_asc}</SelectItem>
                  <SelectItem value="alpha_desc">{SORT_LABELS.alpha_desc}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={setFilter}
                onValueChange={(v) => {
                  setSetFilter(v ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-full sm:w-[210px] rounded-lg text-xs">
                  <span className="truncate">
                    {setFilter === "all"
                      ? `Bộ từ: Tất cả (${selectedSets.length})`
                      : `Bộ từ: ${activeSetTitle}`}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tất cả bộ đã chọn ({selectedSets.length})
                  </SelectItem>
                  {selectedSets.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} ({s.wordCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableLevels.length > 0 && (
                <Select
                  value={levelFilter}
                  onValueChange={(v) => {
                    setLevelFilter(v ?? "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[145px] rounded-lg text-xs">
                    <span className="truncate">
                      {levelFilter === "all" ? "Cấp độ: Tất cả" : levelFilter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả cấp độ</SelectItem>
                    {availableLevels.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {availablePos.length > 0 && (
                <Select
                  value={posFilter}
                  onValueChange={(v) => {
                    setPosFilter(v ?? "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[155px] rounded-lg text-xs">
                    <span className="truncate">
                      {posFilter === "all" ? "Từ loại: Tất cả" : posFilter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả từ loại</SelectItem>
                    {availablePos.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại</span>
                </Button>
              )}
            </div>

            {/* Bulk Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {setFilter !== "all" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onSelectManyWords(activeSetWords.map((w) => w.id))
                      }
                      disabled={activeSetWords.length === 0 || remainingCapacity === 0}
                      className="h-7 gap-1.5 rounded-lg text-[11px] cursor-pointer"
                    >
                      <CheckSquare className="h-3 w-3" />
                      <span>
                        {activeSetWords.length > remainingCapacity && remainingCapacity > 0
                          ? `Chọn ${remainingCapacity} từ ưu tiên (Lv thấp)`
                          : `Chọn tất cả trong bộ này (${activeSetWords.length})`}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onDeselectManyWords(activeSetWords.map((w) => w.id))
                      }
                      disabled={activeSetWords.length === 0}
                      className="h-7 gap-1.5 rounded-lg text-[11px] cursor-pointer"
                    >
                      <Square className="h-3 w-3" />
                      <span>Bỏ chọn bộ này</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onSelectManyWords(filteredWords.map((w) => w.id))
                      }
                      disabled={filteredWords.length === 0 || remainingCapacity === 0}
                      className="h-7 gap-1.5 rounded-lg text-[11px] cursor-pointer"
                    >
                      <CheckSquare className="h-3 w-3" />
                      <span>
                        {filteredWords.length > remainingCapacity && remainingCapacity > 0
                          ? `Chọn ${remainingCapacity} từ ưu tiên (Lv thấp)`
                          : `Chọn kết quả đang lọc (${filteredWords.length})`}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onDeselectManyWords(filteredWords.map((w) => w.id))
                      }
                      disabled={filteredWords.length === 0}
                      className="h-7 gap-1.5 rounded-lg text-[11px] cursor-pointer"
                    >
                      <Square className="h-3 w-3" />
                      <span>Bỏ chọn kết quả lọc</span>
                    </Button>
                  </>
                )}

                {setFilter !== "all" && hasFilters && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onSelectManyWords(filteredWords.map((w) => w.id))
                    }
                    disabled={filteredWords.length === 0 || remainingCapacity === 0}
                    className="h-7 gap-1.5 rounded-lg text-[11px] cursor-pointer"
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span>
                      {filteredWords.length > remainingCapacity && remainingCapacity > 0
                        ? `Chọn ${remainingCapacity} từ lọc ưu tiên`
                        : `Chọn kết quả lọc (${filteredWords.length})`}
                    </span>
                  </Button>
                )}
              </div>

              <span className="text-[11px] text-muted-foreground tabular-nums">
                Hiển thị {filteredWords.length} / {words.length} từ
              </span>
            </div>
          </div>

          {/* Vocabulary Rows */}
          {pageWords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Không tìm thấy từ vựng phù hợp
              </p>
              <p className="text-xs text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các từ khác.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pageWords.map((item) => {
                const isSelected = selectedWordIds.has(item.id);
                const diffLabel = formatDifficultyLabel(item.difficulty);

                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleWord(item.id)}
                    className={cn(
                      "group flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-all cursor-pointer select-none",
                      isSelected
                        ? "border-primary/50 bg-primary/[0.04] shadow-2xs"
                        : "border-border/80 bg-card hover:border-primary/35 hover:bg-muted/20"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-0.5 shrink-0"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleWord(item.id)}
                          aria-label={`Chọn từ ${item.word}`}
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-foreground">
                            {item.word}
                          </span>
                          {item.ipa && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {item.ipa}
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(item.word);
                            }}
                            aria-label={`Phát âm ${item.word}`}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </Button>
                          {item.part_of_speech && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold px-1.5 py-0"
                            >
                              {item.part_of_speech}
                            </Badge>
                          )}
                          {diffLabel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold px-1.5 py-0"
                            >
                              {diffLabel}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono font-semibold px-1.5 py-0",
                              SRS_LEVEL_BADGE_STYLES[item.srsLevel ?? 0] ?? SRS_LEVEL_BADGE_STYLES[0]
                            )}
                          >
                            Lv{item.srsLevel ?? 0}
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-foreground/90">
                          {item.meaning}
                        </p>

                        {item.example && (
                          <p className="text-xs italic text-muted-foreground line-clamp-1">
                            &ldquo;{item.example}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Source Set Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground max-w-[150px]">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.set_color || "hsl(var(--primary))",
                        }}
                      />
                      <span className="truncate" title={item.set_title}>
                        {item.set_title}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span>
                    Trang {safePage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="h-8 gap-1 rounded-lg text-xs cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Trước</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="h-8 gap-1 rounded-lg text-xs cursor-pointer"
                    >
                      <span>Sau</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Selected Vocabulary Panel (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-0 rounded-2xl border border-border/80 bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <ListChecks className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-bold text-foreground truncate">
                Từ vựng đã chọn
              </h3>
              <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold tabular-nums">
                {selectedRecords.length}
              </Badge>
            </div>

            {selectedRecords.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearAllSelected}
                className="h-7 gap-1 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Xóa hết</span>
              </Button>
            )}
          </div>

          {/* Unique count & duplicate merge notice */}
          {selectedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Số từ mục tiêu duy nhất:</span>
                <strong
                  className={cn(
                    "font-bold tabular-nums",
                    uniqueCount > MAX_WORDS_FOR_PERSONAL_TEST
                      ? "text-destructive"
                      : "text-foreground"
                  )}
                >
                  {uniqueCount} / {MAX_WORDS_FOR_PERSONAL_TEST} từ
                </strong>
              </div>

              {duplicateMergedCount > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Có {duplicateMergedCount} bản ghi trùng từ giữa các bộ — hệ thống sẽ giữ nguyên ngữ cảnh và gộp thành {uniqueCount} từ duy nhất khi tạo đề.
                  </span>
                </div>
              )}

              {uniqueCount < MIN_WORDS_FOR_PERSONAL_TEST && (
                <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>
                    Cần chọn ít nhất {MIN_WORDS_FOR_PERSONAL_TEST} từ khác nhau để tạo bài kiểm tra.
                  </span>
                </div>
              )}

              {/* Search inside selected words */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={selectedPanelSearch}
                  onChange={(e) => setSelectedPanelSearch(e.target.value)}
                  placeholder="Tìm trong danh sách đã chọn..."
                  aria-label="Tìm trong danh sách từ đã chọn"
                  className="h-8 rounded-lg pl-8 pr-7 text-xs"
                />
                {selectedPanelSearch && (
                  <button
                    type="button"
                    onClick={() => setSelectedPanelSearch("")}
                    aria-label="Xóa tìm kiếm trong danh sách đã chọn"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selected items list */}
          {selectedRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 py-8 px-4 text-center space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                Chưa có từ nào được chọn
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Nhấn chọn từng từ ở danh sách bên trái hoặc dùng nút chọn nhanh theo bộ.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-1.5">
              {filteredSelectedRecords.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Không có từ đã chọn nào khớp với &ldquo;{selectedPanelSearch}&rdquo;
                </p>
              ) : (
                filteredSelectedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs hover:border-border transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">
                          {rec.word}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          ({rec.set_title})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {rec.meaning}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleWord(rec.id)}
                      aria-label={`Bỏ chọn ${rec.word}`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
