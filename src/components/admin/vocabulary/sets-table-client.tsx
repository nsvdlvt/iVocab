"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, ExternalLink, Trash2, Library } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteVocabSetAction } from "@/actions/admin/vocabulary";
import { toast } from "sonner";

interface SetsTableClientProps {
  sets: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  search: string;
  visibilityFilter: string;
}

export function SetsTableClient({
  sets,
  totalCount,
  currentPage,
  totalPages,
  search: initialSearch,
  visibilityFilter: initialVisibility,
}: SetsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSetToDelete, setSelectedSetToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (newSearch: string, newVisibility: string, newPage: number = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    if (newVisibility && newVisibility !== "all") params.set("visibility", newVisibility);
    else params.delete("visibility");

    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");

    router.push(`/admin/vocabulary-sets?${params.toString()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSetToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteVocabSetAction(selectedSetToDelete.id);
      if (res.ok) {
        toast.success(`Đã xóa bộ từ vựng "${selectedSetToDelete.title}"`);
        setSelectedSetToDelete(null);
        router.refresh();
      } else {
        toast.error("Không thể xóa bộ từ vựng");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(searchTerm, initialVisibility, 1);
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề hoặc mô tả bộ từ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </form>

        <select
          value={initialVisibility}
          onChange={(e) => applyFilters(searchTerm, e.target.value, 1)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tất cả hiển thị</option>
          <option value="public">Công khai (Public)</option>
          <option value="private">Riêng tư (Private)</option>
        </select>
      </div>

      {/* Sets Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Bộ từ vựng</th>
                <th className="px-4 py-3">Tác giả (Chủ sở hữu)</th>
                <th className="px-4 py-3">Số từ</th>
                <th className="px-4 py-3">Hiển thị</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy bộ từ vựng nào phù hợp.
                  </td>
                </tr>
              ) : (
                sets.map((set) => (
                  <tr key={set.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#f9971d] flex items-center justify-center shrink-0">
                          <Library className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/admin/vocabulary-sets/${set.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[220px]"
                          >
                            {set.title}
                          </Link>
                          <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {set.description || "Chưa có mô tả"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {set.profiles?.display_name || set.profiles?.email || set.user_id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-semibold">
                        {set.word_count || 0} từ
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          set.visibility === "public"
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : "text-muted-foreground"
                        }
                      >
                        {set.visibility === "public" ? "Công khai" : "Riêng tư"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(set.created_at), "dd/MM/yyyy", { locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/vocabulary-sets/${set.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                          title="Chi tiết"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedSetToDelete(set)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Xóa bộ từ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>
            Hiển thị <strong>{sets.length}</strong> / <strong>{totalCount}</strong> bộ từ vựng
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(initialSearch, initialVisibility, currentPage - 1)}
              className="h-8 text-xs"
            >
              Trang trước
            </Button>
            <span className="font-medium">
              Trang {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => applyFilters(initialSearch, initialVisibility, currentPage + 1)}
              className="h-8 text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(selectedSetToDelete)} onOpenChange={(open) => !open && setSelectedSetToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bộ từ vựng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn bộ từ vựng <strong>"{selectedSetToDelete?.title}"</strong> và tất cả từ vựng trong bộ này? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedSetToDelete(null)} disabled={isDeleting}>
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
