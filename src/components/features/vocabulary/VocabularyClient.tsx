"use client";

import React, { useState } from "react";
import { VocabSetGrid } from "./VocabSetGrid";
import { VocabSetList } from "./VocabSetList";
import { FilterBar } from "./FilterBar";
import { EditSetDialog } from "./EditSetDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RestoreConfirmDialog } from "./RestoreConfirmDialog";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";
import { useRouter, useSearchParams } from "next/navigation";
import { BookA, ChevronLeft, ChevronRight, FolderOpen, Plus, RotateCcw } from "lucide-react";
import type { VocabSetProgressSummary } from "@/lib/statistics/vocab-set-summary.service";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabularyClientProps {
  sets: VocabSetRow[];
  summaries: Record<string, VocabSetProgressSummary>;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}

export function VocabularyClient({
  sets,
  summaries,
  totalCount,
  currentPage,
  itemsPerPage,
}: VocabularyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const [activeSet, setActiveSet] = useState<VocabSetRow | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  const currentView = searchParams.get("view") || "grid";
  const isTrashView = searchParams.get("visibility") === "deleted";
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleEdit = (set: VocabSetRow) => {
    router.push(`/vocabulary/${set.id}/edit`);
  };

  const handleDelete = (set: VocabSetRow, isPermanent: boolean) => {
    setActiveSet(set);
    setIsPermanentDelete(isPermanent);
    setIsDeleteOpen(true);
  };

  const handleRestore = (set: VocabSetRow) => {
    setActiveSet(set);
    setIsRestoreOpen(true);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/u/vocabulary?${params.toString()}`, { scroll: false });
  };

  const handleResetFilters = () => {
    router.push("/u/vocabulary", { scroll: false });
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("visibility") ||
    searchParams.has("sort");

  return (
    <div className="space-y-5">
      <FilterBar onAddClick={() => router.push("/u/vocabulary/new")} />

      {sets.length > 0 ? (
        <>
          {currentView === "grid" ? (
            <VocabSetGrid
              sets={sets}
              summaries={summaries}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ) : (
            <VocabSetList
              sets={sets}
              summaries={summaries}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <p className="text-xs text-muted-foreground tabular-nums">
                Tổng cộng <strong className="font-semibold text-foreground">{totalCount}</strong> bộ từ vựng
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs font-medium text-muted-foreground tabular-nums">
                  Trang <strong className="text-foreground">{currentPage}</strong> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 px-4 py-16 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div className="max-w-sm space-y-1.5">
            <h4 className="text-sm font-semibold text-foreground">
              {isTrashView
                ? "Thùng rác đang trống"
                : hasFilters
                  ? "Không tìm thấy bộ từ vựng phù hợp"
                  : "Chưa có bộ từ vựng nào"}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isTrashView
                ? "Không có bộ từ vựng nào bị xóa tạm thời."
                : hasFilters
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc hiện tại để xem tất cả bộ từ."
                  : "Bạn chưa có bộ từ vựng nào để bắt đầu học. Hãy tạo bộ từ mới hoặc khám phá kho từ vựng cá nhân để xây dựng lộ trình học thông minh."}
            </p>
          </div>
          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa bộ lọc
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button
                onClick={() => router.push("/u/vocabulary/new")}
                size="sm"
                className="gap-1.5 font-semibold"
              >
                <Plus className="h-4 w-4" />
                Tạo bộ từ mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/u/vocabulary-management")}
                className="gap-1.5"
              >
                <BookA className="h-3.5 w-3.5" />
                Kho từ vựng cá nhân
              </Button>
            </div>
          )}
        </div>
      )}

      <EditSetDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        vocabSet={activeSet}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        vocabSet={activeSet}
        isPermanent={isPermanentDelete}
      />
      <RestoreConfirmDialog
        open={isRestoreOpen}
        onOpenChange={setIsRestoreOpen}
        vocabSet={activeSet}
      />
    </div>
  );
}
