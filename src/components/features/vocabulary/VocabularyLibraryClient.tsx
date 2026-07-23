"use client";

import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  BookOpen,
  CircleCheckBig,
  GraduationCap,
  History,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";
import { SrsService } from "@/lib/srs/srs-service";
import type { VocabularyStats } from "@/lib/statistics/vocabulary-stats.service";
import { EditVocabularyDialog, type EditableVocabulary } from "@/components/features/vocabulary/EditVocabularyDialog";
import type { LibraryVocabularyRow } from "@/repositories/vocabulary.repository";

type SortKey = "created_desc" | "created_asc" | "word_asc" | "word_desc" | "next_review_asc";
type StatusFilter = "all" | "new" | "learning" | "due" | "overdue" | "mastered" | "archived";
type LevelFilter = "all" | "lv0" | "lv1" | "lv2" | "lv3" | "lv4" | "lv5";

interface Props {
  words: LibraryVocabularyRow[];
  stats: VocabularyStats;
}

const PAGE_SIZE = 20;

const LEVEL_STYLES: Record<string, string> = {
  lv0: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  lv1: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  lv2: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  lv3: "bg-yellow-500/10 text-yellow-800 border-yellow-500/20",
  lv4: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  lv5: "bg-violet-500/10 text-violet-700 border-violet-500/20",
};

const SORT_LABELS: Record<SortKey, string> = {
  created_desc: "Mới nhất",
  created_asc: "Cũ nhất",
  word_asc: "A → Z",
  word_desc: "Z → A",
  next_review_asc: "Lần ôn tiếp theo",
};

const LEVEL_LABELS: Record<LevelFilter, string> = {
  all: "Tất cả level",
  lv0: "Lv0",
  lv1: "Lv1",
  lv2: "Lv2",
  lv3: "Lv3",
  lv4: "Lv4",
  lv5: "Lv5",
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
  return LEVEL_STYLES[level] ?? "bg-muted text-muted-foreground border-border";
}

function getStatusMeta(statusKey: StatusFilter) {
  switch (statusKey) {
    case "due":
      return { label: "Cần ôn hôm nay", className: "bg-orange-500/10 text-orange-700 border-orange-500/20" };
    case "overdue":
      return { label: "Quá hạn", className: "bg-red-500/10 text-red-700 border-red-500/20" };
    case "learning":
      return { label: "Đang học", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" };
    case "mastered":
      return { label: "Thành thạo", className: "bg-violet-500/10 text-violet-700 border-violet-500/20" };
    case "archived":
      return { label: "Đã lưu trữ", className: "bg-slate-500/10 text-slate-700 border-slate-500/20" };
    default:
      return { label: "Mới", className: "bg-slate-500/10 text-slate-700 border-slate-500/20" };
  }
}

function getReviewState(row: LibraryVocabularyRow) {
  const review = row.review ?? null;
  const level = SrsService.getLevelFromReview(review);
  const nextReview = review?.next_review ? new Date(review.next_review) : null;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (review?.status === "archived") return { level, status: "Đã lưu trữ", statusKey: "archived" as const };
  if (level >= 5) return { level, status: "Thành thạo", statusKey: "mastered" as const };

  if (level >= 2 && nextReview) {
    const reviewDay = new Date(nextReview);
    reviewDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((reviewDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return { level, status: "Quá hạn", statusKey: "overdue" as const };
    if (diffDays === 0) return { level, status: "Cần ôn hôm nay", statusKey: "due" as const };
    return { level, status: "Đang học", statusKey: "learning" as const };
  }

  if (level >= 1) return { level, status: "Đang học", statusKey: "learning" as const };
  return { level, status: "Mới", statusKey: "new" as const };
}

function friendlyNextReview(nextReview?: string | null) {
  if (!nextReview) return "-";
  const value = new Date(nextReview);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return "Quá hạn";
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  return format(value, "d MMM");
}

export function VocabularyLibraryClient({ words, stats }: Props) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("created_desc");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<LibraryVocabularyRow | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = words.filter((row) => {
      const state = getReviewState(row);
      const matchesQuery =
        !q ||
        row.word.toLowerCase().includes(q) ||
        row.meaning.toLowerCase().includes(q) ||
        (row.ipa ?? "").toLowerCase().includes(q) ||
        (row.part_of_speech ?? "").toLowerCase().includes(q);
      const matchesLevel = levelFilter === "all" || `lv${state.level}` === levelFilter;
      const matchesStatus = statusFilter === "all" || state.statusKey === statusFilter;
      return matchesQuery && matchesLevel && matchesStatus;
    });

    items.sort((a, b) => {
      switch (sort) {
        case "word_asc":
          return a.word.localeCompare(b.word);
        case "word_desc":
          return b.word.localeCompare(a.word);
        case "next_review_asc":
          return (a.review?.next_review ?? "9999").localeCompare(b.review?.next_review ?? "9999");
        case "created_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return items;
  }, [search, levelFilter, statusFilter, sort, words]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageWords = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filtered.length);
  const hasFilters = search || levelFilter !== "all" || statusFilter !== "all" || sort !== "created_desc";

  const statsCards = [
    { title: "Tổng số từ", value: stats.totalWords, icon: BookOpen, iconClassName: "bg-primary/10 text-primary" },
    { title: "Đã thuộc", value: stats.learnedWords, icon: GraduationCap, iconClassName: "bg-emerald-500/10 text-emerald-600" },
    { title: "Cần ôn hôm nay", value: stats.dueToday, icon: History, iconClassName: "bg-red-500/10 text-red-600" },
    { title: "Đã thành thạo", value: stats.masteredWords, icon: CircleCheckBig, iconClassName: "bg-amber-500/10 text-amber-600" },
  ] as const;

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
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2 md:grid-cols-4 xl:gap-4">
        {statsCards.map(({ title, value, icon: Icon, iconClassName }) => (
          <StatCard
            key={title}
            title={title}
            value={value}
            icon={Icon}
            compactOnMobile
            iconClassName={iconClassName}
          />
        ))}
      </div>

      <SectionCard className="space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ vựng..."
              className="h-10 rounded-xl pl-9"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-center">
            <Select value={levelFilter} onValueChange={(value) => setLevelFilter((value ?? "all") as LevelFilter)}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl">
                <span>{getLevelFilterLabel(levelFilter)}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Level</SelectItem>
                {(["lv0", "lv1", "lv2", "lv3", "lv4", "lv5"] as LevelFilter[]).map((level) => (
                  <SelectItem key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? "all") as StatusFilter)}>
              <SelectTrigger className="h-10 w-[170px] rounded-xl">
                <span>{getStatusFilterLabel(statusFilter)}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Trạng thái</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="learning">Đang học</SelectItem>
                <SelectItem value="due">Cần ôn hôm nay</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
                <SelectItem value="mastered">Thành thạo</SelectItem>
                <SelectItem value="archived">Đã lưu trữ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => setSort((value ?? "created_desc") as SortKey)}>
              <SelectTrigger className="h-10 w-[170px] rounded-xl">
                <span>{getSortLabel(sort)}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">{SORT_LABELS.created_desc}</SelectItem>
                <SelectItem value="created_asc">{SORT_LABELS.created_asc}</SelectItem>
                <SelectItem value="word_asc">{SORT_LABELS.word_asc}</SelectItem>
                <SelectItem value="word_desc">{SORT_LABELS.word_desc}</SelectItem>
                <SelectItem value="next_review_asc">{SORT_LABELS.next_review_asc}</SelectItem>
              </SelectContent>
            </Select>

            <Button className="ml-auto h-10 rounded-xl gap-2" onClick={() => router.push("/vocabulary/new")}>
              Thêm từ
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Từ</TableHead>
                <TableHead>Nghĩa</TableHead>
                <TableHead>IPA</TableHead>
                <TableHead>Từ loại</TableHead>
                <TableHead>Mức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lần ôn tiếp theo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageWords.length > 0 ? (
                pageWords.map((row) => {
                  const state = getReviewState(row);
                  const statusMeta = getStatusMeta(state.statusKey);
                  return (
                    <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                      <TableCell className="max-w-[16rem] truncate font-semibold">{row.word}</TableCell>
                      <TableCell className="max-w-[20rem] truncate text-muted-foreground">{row.meaning}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.ipa ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{row.part_of_speech ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", getLevelClass(`lv${state.level}`))}
                        >
                          Lv{state.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", statusMeta.className)}
                        >
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{friendlyNextReview(row.review?.next_review ?? null)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    {hasFilters ? "Không tìm thấy từ vựng phù hợp." : "Thư viện từ vựng của bạn đang trống."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Đang hiển thị {startItem}–{endItem} trên tổng số {filtered.length}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Trang {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                Trước
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                Sau
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-xl">
          {selected && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border pb-4">
                <SheetTitle className="text-3xl font-bold text-blue-600">{selected.word}</SheetTitle>
                <SheetDescription className="pt-1 text-sm text-muted-foreground">
                  {selected.vocab_sets?.title ? (
                    <Link
                      href={`/vocabulary/${selected.set_id}?focusWord=${selected.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {selected.vocab_sets.title}
                    </Link>
                  ) : (
                    "Không tìm thấy bộ từ vựng"
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail label="IPA" value={selected.ipa ?? "-"} mono />
                  <Detail label="Từ loại" value={selected.part_of_speech ?? "-"} />
                  <Detail label="Nghĩa" value={selected.meaning} />
                  <Detail label="Mức hiện tại" value={`Lv${getReviewState(selected).level}`} />
                  <Detail label="Trạng thái hiện tại" value={getReviewState(selected).status} />
                  <Detail label="Lần ôn tiếp theo" value={friendlyNextReview(selected.review?.next_review ?? null)} />
                </div>

                <Detail label="Ví dụ" value={selected.example ?? "-"} />
                <Detail label="Từ đồng nghĩa" value={selected.synonyms?.length ? selected.synonyms.join(", ") : "-"} />
                <Detail label="Ghi chú" value={selected.note ?? "-"} />
              </div>

              <div className="border-t border-border p-4">
                <Button className="w-full rounded-xl" onClick={() => setEditOpen(true)}>
                  Chỉnh sửa từ
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <EditVocabularyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={selectedEditable}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}
