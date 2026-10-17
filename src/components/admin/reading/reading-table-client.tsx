"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, BookOpen, Pencil, Trash2, ExternalLink, Plus, Clock } from "lucide-react";
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
import { toggleReadingArticleStatusAction, deleteReadingArticleAction } from "@/actions/admin/reading";
import { toast } from "sonner";
import { ReadingArticleRow } from "@/repositories/admin/reading.repository";

interface ReadingTableClientProps {
  articles: ReadingArticleRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  search: string;
  statusFilter: string;
}

export function ReadingTableClient({
  articles,
  totalCount,
  currentPage,
  totalPages,
  search: initialSearch,
  statusFilter: initialStatus,
}: ReadingTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [deletingArticle, setDeletingArticle] = useState<ReadingArticleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (newSearch: string, newStatus: string, newPage: number = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    else params.delete("status");

    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");

    router.push(`/admin/reading?${params.toString()}`);
  };

  const handleToggleStatus = async (article: ReadingArticleRow) => {
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      const res = await toggleReadingArticleStatusAction(article.id, nextStatus);
      if (res.ok) {
        toast.success(`Đã chuyển bài đọc thành "${nextStatus === "published" ? "Đã xuất bản" : "Bản nháp"}"`);
        router.refresh();
      } else {
        toast.error("Không thể thay đổi trạng thái bài đọc");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticle) return;
    setIsDeleting(true);
    try {
      const res = await deleteReadingArticleAction(deletingArticle.id);
      if (res.ok) {
        toast.success(`Đã xóa bài đọc "${deletingArticle.title}"`);
        setDeletingArticle(null);
        router.refresh();
      } else {
        toast.error("Không thể xóa bài đọc");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(searchTerm, initialStatus, 1);
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề hoặc mô tả bài đọc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={initialStatus}
            onChange={(e) => applyFilters(searchTerm, e.target.value, 1)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
          </select>

          <Link
            href="/admin/reading/new"
            className={cn(buttonVariants({ variant: "default" }), "h-10 bg-[#f9971d] hover:bg-[#e68512] text-[#030f31] font-semibold")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm Bài đọc Mới
          </Link>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Bài đọc</th>
                <th className="px-4 py-3">Chủ đề & Cấp độ</th>
                <th className="px-4 py-3">Thời gian đọc</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy bài đọc nào.
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/admin/reading/${art.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[240px]"
                          >
                            {art.title}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                            /{art.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs capitalize">{art.topic}</Badge>
                        <Badge variant="secondary" className="text-xs">{art.level}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{art.estimated_reading_minutes} phút</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(art)}
                        className="cursor-pointer"
                        title="Bấm để đổi trạng thái"
                      >
                        <Badge
                          variant="outline"
                          className={
                            art.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }
                        >
                          {art.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(art.created_at), "dd/MM/yyyy", { locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/reading/${art.slug}`}
                          target="_blank"
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                          title="Xem bài đọc"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/reading/${art.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingArticle(art)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Xóa bài đọc"
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
            Hiển thị <strong>{articles.length}</strong> / <strong>{totalCount}</strong> bài đọc
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(initialSearch, initialStatus, currentPage - 1)}
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
              onClick={() => applyFilters(initialSearch, initialStatus, currentPage + 1)}
              className="h-8 text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deletingArticle)} onOpenChange={(open) => !open && setDeletingArticle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bài đọc song ngữ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài đọc <strong>"{deletingArticle?.title}"</strong>? Các điểm nhấn (highlights) và câu hỏi liên kết cũng sẽ bị gỡ bỏ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingArticle(null)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa bài đọc"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
