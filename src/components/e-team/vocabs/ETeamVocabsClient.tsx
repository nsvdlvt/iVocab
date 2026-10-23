"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";
import { ETeamVocabFilterBar } from "./ETeamVocabFilterBar";
import { ETeamVocabCard } from "./ETeamVocabCard";
import { DeleteConfirmDialog } from "@/components/features/vocabulary/DeleteConfirmDialog";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";
import { ROUTES } from "@/constants/routes";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface ETeamVocabsClientProps {
  sets: VocabSetRow[];
  summaries: Record<string, VocabSetProgressSummary>;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}

export function ETeamVocabsClient({
  sets,
  summaries,
  totalCount,
  currentPage,
  itemsPerPage,
}: ETeamVocabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetSet, setTargetSet] = useState<VocabSetRow | null>(null);

  const currentView = searchParams.get("view") || "grid";
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${ROUTES.ETEAM_VOCABS}?${params.toString()}`, { scroll: false });
  };

  const handleResetFilters = () => {
    router.push(ROUTES.ETEAM_VOCABS, { scroll: false });
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("visibility") ||
    searchParams.has("sort");

  const handleDelete = (set: VocabSetRow) => {
    setTargetSet(set);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Học từ vựng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Khám phá và ôn luyện các bộ từ vựng với lộ trình thích ứng thông minh AI.
          </p>
        </div>

        <Button
          onClick={() => router.push("/u/vocabulary/new")}
          className="h-10 gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm sm:self-auto self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo bộ từ mới</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <ETeamVocabFilterBar onAddClick={() => router.push("/u/vocabulary/new")} />

      {/* Vocabulary Sets Section */}
      {sets.length > 0 ? (
        <>
          <div
            className={
              currentView === "grid"
                ? "grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5"
                : "flex flex-col gap-3"
            }
          >
            {sets.map((set) => (
              <ETeamVocabCard
                key={set.id}
                set={set}
                summary={summaries[set.id] ?? null}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <span>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} trên {totalCount} bộ từ
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 gap-1 rounded-lg px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Trước</span>
                </Button>

                <span className="px-2 font-medium text-foreground">
                  Trang {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 gap-1 rounded-lg px-2 text-xs"
                >
                  <span>Sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center shadow-2xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-purple-600/10 text-purple-600 dark:text-purple-400">
            {hasFilters ? (
              <FolderOpen className="h-7 w-7" />
            ) : (
              <BookOpen className="h-7 w-7" />
            )}
          </div>

          <div className="mt-4 max-w-sm space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              {hasFilters
                ? "Không tìm thấy bộ từ vựng nào"
                : "Bạn chưa có bộ từ vựng nào"}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {hasFilters
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc để hiển thị kết quả."
                : "Tạo bộ từ vựng đầu tiên hoặc thêm các từ vựng bạn muốn học để bắt đầu chu trình thích ứng Flashcard và AI Practice."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 rounded-lg text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại bộ lọc</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push("/u/vocabulary/new")}
                className="gap-1.5 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo bộ từ vựng mới</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vocabSet={targetSet}
        isPermanent={false}
      />
    </div>
  );
}
