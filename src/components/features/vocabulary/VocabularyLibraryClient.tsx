"use client";

import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  BookOpen,
  Clock3,
  GraduationCap,
  Medal,
  Search,
  Funnel,
  Volume2,
  ExternalLink,
  Edit2,
  Star,
  X,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { FavoriteToggleButton } from "@/components/common/FavoriteToggleButton";
import { cn } from "@/lib/utils";
import { toggleFavoriteVocabulary } from "@/actions/vocabulary/favorite";
import { toast } from "sonner";
import { SrsService } from "@/lib/srs/srs-service";
import type { VocabularyStats } from "@/lib/statistics/vocabulary-stats.service";
import {
  EditVocabularyDialog,
  type EditableVocabulary,
} from "@/components/features/vocabulary/EditVocabularyDialog";
import type { LibraryVocabularyRow } from "@/repositories/vocabulary.repository";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useSpeak } from "@/hooks/use-speak";

type SortKey =
  | "created_desc"
  | "created_asc"
  | "word_asc"
  | "word_desc"
  | "next_review_asc";
type StatusFilter =
  | "all"
  | "new"
  | "learning"
  | "due"
  | "overdue"
  | "mastered"
  | "archived";
type LevelFilter = "all" | "lv0" | "lv1" | "lv2" | "lv3" | "lv4" | "lv5";

interface Props {
  words: LibraryVocabularyRow[];
  stats: VocabularyStats;
}

const PAGE_SIZE = 20;

const LEVEL_STYLES: Record<string, string> = {
  lv0: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  lv1: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300",
  lv2: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  lv3: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
  lv4: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  lv5: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
};

const SORT_LABELS: Record<SortKey, string> = {
  created_desc: "Mới nhất",
  created_asc: "Cũ nhất",
  word_asc: "A → Z",
  word_desc: "Z → A",
  next_review_asc: "Lần ôn tiếp theo",
};

const LEVEL_LABELS: Record<LevelFilter, string> = {
  all: "Tất cả Level",
  lv0: "Lv0",
  lv1: "Lv1",
  lv2: "Lv2",
  lv3: "Lv3",
  lv4: "Lv4",
  lv5: "Lv5",
};

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  pronoun: "Đại từ",
  interjection: "Thán từ",
};

function getLevelFilterLabel(level: LevelFilter) {
  return LEVEL_LABELS[level];
}

function getStatusFilterLabel(status: StatusFilter) {
  switch (status) {
    case "all":
      return "Tất cả trạng thái";
    case "new":
      return "Mới";
    case "learning":
      return "Đang học";
    case "due":
      return "Cần ôn hôm nay";
    case "overdue":
      return "Quá hạn";
    case "mastered":
      return "Thành thạo";
    case "archived":
      return "Đã lưu trữ";
  }
}

function getSortLabel(sort: SortKey) {
  return SORT_LABELS[sort];
}

function getLevelClass(level: string) {
  return (
    LEVEL_STYLES[level] ?? "bg-muted text-muted-foreground border-border"
  );
}

function getStatusMeta(statusKey: StatusFilter) {
  switch (statusKey) {
    case "due":
      return {
        label: "Cần ôn hôm nay",
        className:
          "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
      };
    case "overdue":
      return {
        label: "Quá hạn",
        className:
          "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
      };
    case "learning":
      return {
        label: "Đang học",
        className:
          "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
      };
    case "mastered":
      return {
        label: "Thành thạo",
        className:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
      };
    case "archived":
      return {
        label: "Đã lưu trữ",
        className:
          "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300",
      };
    default:
      return {
        label: "Mới",
        className:
          "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
      };
  }
}

function getReviewState(row: LibraryVocabularyRow) {
  const review = row.review ?? null;
  const level = SrsService.getLevelFromReview(review);
  const nextReview = review?.next_review ? new Date(review.next_review) : null;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (review?.status === "archived")
    return { level, status: "Đã lưu trữ", statusKey: "archived" as const };
  if (level >= 5)
    return { level, status: "Thành thạo", statusKey: "mastered" as const };
  if (level < 2 && !review)
    return { level, status: "Mới", statusKey: "new" as const };

  if (nextReview) {
    const reviewDay = new Date(nextReview);
    reviewDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (reviewDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffDays < 0)
      return { level, status: "Quá hạn", statusKey: "overdue" as const };
    if (diffDays === 0)
      return {
        level,
        status: "Cần ôn hôm nay",
        statusKey: "due" as const,
      };
    return { level, status: "Đang học", statusKey: "learning" as const };
  }

  if (level >= 1)
    return { level, status: "Đang học", statusKey: "learning" as const };
  return { level, status: "Mới", statusKey: "new" as const };
}

function friendlyNextReview(nextReview?: string | null) {
  if (!nextReview) return "—";
  const value = new Date(nextReview);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays < 0) return "Quá hạn";
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  return format(value, "dd/MM/yyyy");
}

function getFriendlyNextReview(row: LibraryVocabularyRow) {
  const review = row.review ?? null;
  const level = SrsService.getLevelFromReview(review);
  if (
    !review?.next_review ||
    level < 2 ||
    level >= 5 ||
    review.status === "new" ||
    review.status === "learning"
  ) {
    return "—";
  }
  return friendlyNextReview(review.next_review);
}

export function VocabularyLibraryClient({ words, stats }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  useScrollRestoration(pathname);
  const { speakText } = useSpeak();

  const [localWords, setLocalWords] = React.useState(words);
  // Note: if words prop changes (server re-fetch), parent should update via key prop to reset this component.
  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [onlyStarred, setOnlyStarred] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("created_desc");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<LibraryVocabularyRow | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const toggleFavorite = React.useCallback(
    async (row: LibraryVocabularyRow) => {
      const nextFavorite = !Boolean(row.is_starred);
      setLocalWords((prev) =>
        prev.map((word) =>
          word.id === row.id ? { ...word, is_starred: nextFavorite } : word
        )
      );
      setSelected((prev) =>
        prev?.id === row.id ? { ...prev, is_starred: nextFavorite } : prev
      );
      try {
        await toggleFavoriteVocabulary(row.id, nextFavorite);
        toast.success(
          nextFavorite ? "Đã đánh dấu yêu thích" : "Đã bỏ đánh dấu yêu thích"
        );
      } catch (error) {
        console.error("Favorite update error:", error);
        setLocalWords((prev) =>
          prev.map((word) =>
            word.id === row.id ? { ...word, is_starred: !nextFavorite } : word
          )
        );
        setSelected((prev) =>
          prev?.id === row.id ? { ...prev, is_starred: !nextFavorite } : prev
        );
        toast.error("Không thể cập nhật trạng thái yêu thích");
      }
    },
    []
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = localWords.filter((row) => {
      if (onlyStarred && !row.is_starred) return false;
      const state = getReviewState(row);
      const matchesQuery =
        !q ||
        row.word.toLowerCase().includes(q) ||
        row.meaning.toLowerCase().includes(q) ||
        (row.ipa ?? "").toLowerCase().includes(q) ||
        (row.part_of_speech ?? "").toLowerCase().includes(q) ||
        (row.vocab_sets?.title ?? "").toLowerCase().includes(q);
      const matchesLevel =
        levelFilter === "all" || `lv${state.level}` === levelFilter;
      const matchesStatus =
        statusFilter === "all" || state.statusKey === statusFilter;
      return matchesQuery && matchesLevel && matchesStatus;
    });

    items.sort((a, b) => {
      switch (sort) {
        case "word_asc":
          return a.word.localeCompare(b.word);
        case "word_desc":
          return b.word.localeCompare(a.word);
        case "next_review_asc":
          return (a.review?.next_review ?? "9999").localeCompare(
            b.review?.next_review ?? "9999"
          );
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return items;
  }, [search, levelFilter, statusFilter, onlyStarred, sort, localWords]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageWords = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filtered.length);
  const hasFilters = Boolean(
    search ||
      levelFilter !== "all" ||
      statusFilter !== "all" ||
      onlyStarred ||
      sort !== "created_desc"
  );

  const handleResetFilters = () => {
    setSearch("");
    setLevelFilter("all");
    setStatusFilter("all");
    setOnlyStarred(false);
    setSort("created_desc");
    setPage(1);
  };

  const statsCards = [
    {
      title: "Tổng số từ",
      compactTitle: "TỔNG TỪ",
      value: stats.totalWords,
      icon: BookOpen,
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      active: statusFilter === "all" && levelFilter === "all" && !onlyStarred,
      onClick: () => {
        setStatusFilter("all");
        setLevelFilter("all");
        setPage(1);
      },
    },
    {
      title: "Đã thuộc",
      compactTitle: "ĐÃ THUỘC",
      value: stats.learnedWords,
      icon: GraduationCap,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      active: statusFilter === "learning",
      onClick: () => {
        setStatusFilter((prev) => (prev === "learning" ? "all" : "learning"));
        setPage(1);
      },
    },
    {
      title: "Cần ôn hôm nay",
      compactTitle: "ĐẾN HẠN",
      value: stats.dueToday,
      icon: Clock3,
      iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
      active: statusFilter === "due",
      onClick: () => {
        setStatusFilter((prev) => (prev === "due" ? "all" : "due"));
        setPage(1);
      },
    },
    {
      title: "Đã thành thạo",
      compactTitle: "THÀNH THẠO",
      value: stats.masteredWords,
      icon: Medal,
      iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      active: statusFilter === "mastered",
      onClick: () => {
        setStatusFilter((prev) => (prev === "mastered" ? "all" : "mastered"));
        setPage(1);
      },
    },
  ];

  const selectedEditable: EditableVocabulary | null = selected
    ? {
        id: selected.id,
        word: selected.word,
        meaning: selected.meaning,
        ipa: selected.ipa,
        part_of_speech: selected.part_of_speech,
        example: selected.example,
        synonyms: selected.synonyms,
        note: selected.note,
      }
    : null;

  return (
    <div className="space-y-5">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {statsCards.map(
          ({
            title,
            compactTitle,
            value,
            icon: Icon,
            iconClassName,
            active,
            onClick,
          }) => (
            <StatCard
              key={title}
              title={title}
              compactTitle={compactTitle}
              value={value}
              icon={Icon}
              compactOnMobile
              iconClassName={iconClassName}
              active={active}
              onClick={onClick}
            />
          )
        )}
      </div>

      {/* Main Content Card */}
      <SectionCard className="space-y-4 rounded-xl border-border/80 p-4 sm:p-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + Quick Starred Filter */}
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm từ, nghĩa, IPA hoặc tên bộ từ..."
                className="h-9 rounded-lg pl-9 pr-8 text-xs sm:text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant={onlyStarred ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setOnlyStarred((prev) => !prev);
                setPage(1);
              }}
              className={cn(
                "h-9 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-medium",
                onlyStarred &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              )}
              title="Lọc từ yêu thích"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  onlyStarred && "fill-amber-400 text-amber-500"
                )}
              />
              <span className="hidden sm:inline">Yêu thích</span>
            </Button>
          </div>

          {/* Right Filters & Add Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <div className="hidden md:flex items-center gap-2">
              <Select
                value={levelFilter}
                onValueChange={(value) => {
                  setLevelFilter((value ?? "all") as LevelFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[140px] rounded-lg text-xs font-medium">
                  <span className="truncate">
                    {getLevelFilterLabel(levelFilter)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả Level</SelectItem>
                  {(
                    ["lv0", "lv1", "lv2", "lv3", "lv4", "lv5"] as LevelFilter[]
                  ).map((level) => (
                    <SelectItem key={level} value={level}>
                      {LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter((value ?? "all") as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[160px] rounded-lg text-xs font-medium">
                  <span className="truncate">
                    {getStatusFilterLabel(statusFilter)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="learning">Đang học</SelectItem>
                  <SelectItem value="due">Cần ôn hôm nay</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                  <SelectItem value="mastered">Thành thạo</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sort}
                onValueChange={(value) =>
                  setSort((value ?? "created_desc") as SortKey)
                }
              >
                <SelectTrigger className="h-9 w-[155px] rounded-lg text-xs font-medium">
                  <span className="truncate">{getSortLabel(sort)}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">
                    {SORT_LABELS.created_desc}
                  </SelectItem>
                  <SelectItem value="created_asc">
                    {SORT_LABELS.created_asc}
                  </SelectItem>
                  <SelectItem value="word_asc">
                    {SORT_LABELS.word_asc}
                  </SelectItem>
                  <SelectItem value="word_desc">
                    {SORT_LABELS.word_desc}
                  </SelectItem>
                  <SelectItem value="next_review_asc">
                    {SORT_LABELS.next_review_asc}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filter Dropdown */}
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 gap-1.5 rounded-lg text-xs"
                  )}
                >
                  <Funnel className="h-3.5 w-3.5" />
                  <span>Bộ lọc</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                      Level ({getLevelFilterLabel(levelFilter)})
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={levelFilter}
                        onValueChange={(v) => {
                          setLevelFilter(v as LevelFilter);
                          setPage(1);
                        }}
                      >
                        <DropdownMenuRadioItem value="all">
                          Tất cả Level
                        </DropdownMenuRadioItem>
                        {(
                          [
                            "lv0",
                            "lv1",
                            "lv2",
                            "lv3",
                            "lv4",
                            "lv5",
                          ] as LevelFilter[]
                        ).map((level) => (
                          <DropdownMenuRadioItem key={level} value={level}>
                            {LEVEL_LABELS[level]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                      Trạng thái ({getStatusFilterLabel(statusFilter)})
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={statusFilter}
                        onValueChange={(v) => {
                          setStatusFilter(v as StatusFilter);
                          setPage(1);
                        }}
                      >
                        <DropdownMenuRadioItem value="all">
                          Tất cả trạng thái
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="new">
                          Mới
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="learning">
                          Đang học
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="due">
                          Cần ôn hôm nay
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="overdue">
                          Quá hạn
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="mastered">
                          Thành thạo
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="archived">
                          Đã lưu trữ
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                      Sắp xếp ({getSortLabel(sort)})
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={sort}
                        onValueChange={(v) => setSort(v as SortKey)}
                      >
                        <DropdownMenuRadioItem value="created_desc">
                          {SORT_LABELS.created_desc}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="created_asc">
                          {SORT_LABELS.created_asc}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="word_asc">
                          {SORT_LABELS.word_asc}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="word_desc">
                          {SORT_LABELS.word_desc}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="next_review_asc">
                          {SORT_LABELS.next_review_asc}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đặt lại</span>
              </Button>
            )}

            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-semibold"
              onClick={() => router.push("/vocabulary/new")}
            >
              <Plus className="h-4 w-4" />
              <span>Thêm từ</span>
            </Button>
          </div>
        </div>

        {/* Empty State vs Data List */}
        {pageWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/15 py-14 px-6 text-center">
            <BeeMascot
              state={hasFilters ? "thinking" : "encouraging"}
              size="lg"
              showAura
              interactive
            />
            <div className="space-y-1.5 max-w-sm">
              <p className="text-base font-bold text-foreground">
                {hasFilters
                  ? "Không tìm thấy từ vựng phù hợp"
                  : "Tổ ong từ vựng đang chờ bạn"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {hasFilters
                  ? "Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để khám phá thêm."
                  : "Bắt đầu tạo bộ từ vựng đầu tiên hoặc tra cứu để xây dựng kho tri thức riêng của bạn nhé! 🐝"}
              </p>
            </div>
            {hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="rounded-full gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Xóa bộ lọc</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push("/vocabulary/new")}
                className="rounded-full gap-1.5 text-xs font-semibold px-4"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bộ từ ngay</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead
                      className="w-11 text-center"
                      aria-label="Yêu thích"
                    >
                      <Star className="h-3.5 w-3.5 mx-auto text-muted-foreground" aria-hidden="true" />
                    </TableHead>
                    <TableHead>Từ vựng</TableHead>
                    <TableHead>Ý nghĩa</TableHead>
                    <TableHead>IPA & Từ loại</TableHead>
                    <TableHead>Bộ từ</TableHead>
                    <TableHead>Mức SRS</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Ôn tiếp theo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageWords.map((row) => {
                    const state = getReviewState(row);
                    const statusMeta = getStatusMeta(state.statusKey);
                    const posLabel = row.part_of_speech
                      ? PART_OF_SPEECH_LABELS[
                          row.part_of_speech.toLowerCase()
                        ] ?? row.part_of_speech
                      : null;

                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer transition-colors hover:bg-muted/35"
                        data-scroll-anchor={`vocab-row-${row.id}`}
                        onClick={() => setSelected(row)}
                      >
                        <TableCell
                          className="w-11 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteToggleButton
                            isFavorite={Boolean(row.is_starred)}
                            onToggle={() => void toggleFavorite(row)}
                          />
                        </TableCell>
                        <TableCell className="max-w-[14rem]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-foreground">
                              {row.word}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(row.word, {
                                  audioUrl: row.audio_url ?? undefined,
                                });
                              }}
                              aria-label={`Phát âm ${row.word}`}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[18rem] truncate text-foreground/90">
                          {row.meaning}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.ipa && (
                              <span className="font-mono text-xs text-muted-foreground">
                                {row.ipa}
                              </span>
                            )}
                            {posLabel && (
                              <Badge
                                variant="secondary"
                                className="rounded-md text-[10px]"
                              >
                                {posLabel}
                              </Badge>
                            )}
                            {!row.ipa && !posLabel && (
                              <span className="text-xs text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[11rem]">
                          {row.vocab_sets?.title ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {row.vocab_sets.title}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                              getLevelClass(`lv${state.level}`)
                            )}
                          >
                            Lv{state.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                              statusMeta.className
                            )}
                          >
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {getFriendlyNextReview(row)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Cards (< md) */}
            <div className="flex flex-col gap-2.5 md:hidden">
              {pageWords.map((row) => {
                const state = getReviewState(row);
                const statusMeta = getStatusMeta(state.statusKey);
                const posLabel = row.part_of_speech
                  ? PART_OF_SPEECH_LABELS[row.part_of_speech.toLowerCase()] ??
                    row.part_of_speech
                  : null;

                return (
                  <div
                    key={row.id}
                    data-scroll-anchor={`vocab-row-${row.id}`}
                    onClick={() => setSelected(row)}
                    className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-colors hover:border-primary/30 cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <FavoriteToggleButton
                            isFavorite={Boolean(row.is_starred)}
                            onToggle={() => void toggleFavorite(row)}
                            className="-ml-1 shrink-0"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              {row.word}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(row.word, {
                                  audioUrl: row.audio_url ?? undefined,
                                });
                              }}
                              aria-label={`Phát âm ${row.word}`}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                            {posLabel && (
                              <Badge
                                variant="secondary"
                                className="rounded-md text-[10px]"
                              >
                                {posLabel}
                              </Badge>
                            )}
                          </div>
                          {row.ipa && (
                            <span className="block font-mono text-xs text-muted-foreground">
                              {row.ipa}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            getLevelClass(`lv${state.level}`)
                          )}
                        >
                          Lv{state.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            statusMeta.className
                          )}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="pl-7 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {row.meaning}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">
                          {row.vocab_sets?.title ?? "Bộ từ vựng"}
                        </span>
                        <span className="tabular-nums shrink-0">
                          Ôn: {getFriendlyNextReview(row)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-3.5 sm:flex-row">
          <div className="text-xs text-muted-foreground tabular-nums">
            Hiển thị{" "}
            <strong className="font-semibold text-foreground">
              {startItem}–{endItem}
            </strong>{" "}
            trên tổng số{" "}
            <strong className="font-semibold text-foreground">
              {filtered.length}
            </strong>{" "}
            từ vựng
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground tabular-nums">
              Trang <strong className="text-foreground">{safePage}</strong> /{" "}
              {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Slide-over Detail Sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          {selected &&
            (() => {
              const state = getReviewState(selected);
              const statusMeta = getStatusMeta(state.statusKey);
              const posLabel = selected.part_of_speech
                ? PART_OF_SPEECH_LABELS[
                    selected.part_of_speech.toLowerCase()
                  ] ?? selected.part_of_speech
                : null;

              return (
                <div className="flex h-full flex-col">
                  <SheetHeader className="border-b border-border/80 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                            {selected.word}
                          </SheetTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() =>
                              speakText(selected.word, {
                                audioUrl: selected.audio_url ?? undefined,
                              })
                            }
                            aria-label={`Phát âm ${selected.word}`}
                            className="rounded-lg"
                          >
                            <Volume2 className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <FavoriteToggleButton
                            isFavorite={Boolean(selected.is_starred)}
                            onToggle={() => void toggleFavorite(selected)}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {selected.ipa && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {selected.ipa}
                            </span>
                          )}
                          {posLabel && (
                            <Badge variant="secondary">{posLabel}</Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-semibold tabular-nums",
                              getLevelClass(`lv${state.level}`)
                            )}
                          >
                            Lv{state.level}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("font-semibold", statusMeta.className)}
                          >
                            {statusMeta.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <SheetDescription className="text-xs text-muted-foreground">
                      {selected.vocab_sets?.title ? (
                        <Link
                          href={`/vocabulary/${selected.set_id}?focusWord=${selected.id}`}
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Thuộc bộ từ: {selected.vocab_sets.title}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        "Không tìm thấy bộ từ vựng"
                      )}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <Detail title="Ý nghĩa tiếng Việt" value={selected.meaning} />

                    <div className="grid grid-cols-2 gap-3">
                      <Detail
                        title="Mức SRS hiện tại"
                        value={`Level ${state.level} (${state.status})`}
                      />
                      <Detail
                        title="Lần ôn tiếp theo"
                        value={getFriendlyNextReview(selected)}
                      />
                    </div>

                    <Detail
                      title="Câu ví dụ"
                      value={
                        selected.example ? (
                          <div className="space-y-1">
                            <p className="italic">&ldquo;{selected.example}&rdquo;</p>
                            {selected.example_translation && (
                              <p className="text-xs text-muted-foreground not-italic">
                                {selected.example_translation}
                              </p>
                            )}
                          </div>
                        ) : (
                          "Chưa có câu ví dụ"
                        )
                      }
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Detail
                        title="Từ đồng nghĩa"
                        value={
                          selected.synonyms?.length
                            ? selected.synonyms.join(", ")
                            : "—"
                        }
                      />
                      <Detail
                        title="Từ trái nghĩa"
                        value={
                          selected.antonyms?.length
                            ? selected.antonyms.join(", ")
                            : "—"
                        }
                      />
                    </div>

                    <Detail
                      title="Ghi chú học tập"
                      value={selected.note || "Chưa có ghi chú"}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-border/80 bg-muted/20 p-4">
                    {selected.set_id && (
                      <Link
                        href={`/vocabulary/${selected.set_id}?focusWord=${selected.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "flex-1 gap-1.5 rounded-lg text-xs font-medium"
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Mở trong bộ từ</span>
                      </Link>
                    )}
                    <Button
                      className="flex-1 gap-1.5 rounded-lg text-xs font-semibold"
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Chỉnh sửa từ</span>
                    </Button>
                  </div>
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>

      <EditVocabularyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={selectedEditable}
        onSaved={(updated) => {
          setLocalWords((prev) =>
            prev.map((word) =>
              word.id === updated.id ? { ...word, ...updated } : word
            )
          );
          setSelected((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev
          );
        }}
      />
    </div>
  );
}

function Detail({
  title,
  value,
  mono,
}: {
  title: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div
        className={cn(
          "mt-1.5 text-sm font-medium text-foreground leading-relaxed",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </div>
    </div>
  );
}
