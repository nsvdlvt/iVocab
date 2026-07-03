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
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface VocabularyClientProps {
  sets: VocabSetRow[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}

export function VocabularyClient({ sets, totalCount, currentPage, itemsPerPage }: VocabularyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const [activeSet, setActiveSet] = useState<VocabSetRow | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  const currentView = searchParams.get("view") || "grid";
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleEdit = (set: VocabSetRow) => {
    setActiveSet(set);
    setIsEditOpen(true);
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
    router.push(`/vocabulary?${params.toString()}`, { scroll: false });
  };

  const hasFilters = searchParams.has("search") || searchParams.has("visibility") || searchParams.has("sort");

  return (
    <div className="space-y-6">
      <FilterBar onAddClick={() => router.push("/vocabulary/new")} />

      {sets.length > 0 ? (
        <>
          {currentView === "grid" ? (
            <VocabSetGrid
              sets={sets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ) : (
            <VocabSetList
              sets={sets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground font-medium px-2">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-xl bg-muted/5 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/60">
            <Inbox className="h-6 w-6 animate-bounce" />
          </div>
          <div className="text-center space-y-1 max-w-sm">
            <h4 className="font-bold text-sm">
              {hasFilters ? "Không tìm thấy bộ từ vựng" : "Chưa có bộ từ vựng nào"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hasFilters
                ? "Thử thay đổi từ khóa hoặc bộ lọc để hiển thị kết quả mong muốn."
                : "Tạo bộ từ vựng đầu tiên của bạn để bắt đầu lưu trữ và ôn tập từ vựng."}
            </p>
          </div>
          {!hasFilters && (
            <Button onClick={() => router.push("/vocabulary/new")} className="text-xs font-semibold rounded-lg h-9">
              Tạo bộ từ mới
            </Button>
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
