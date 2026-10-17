"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Pencil, Trash2, BookA, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateVocabWordAction, deleteVocabWordAction } from "@/actions/admin/vocabulary";
import { toast } from "sonner";

interface WordsTableClientProps {
  words: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  search: string;
  partOfSpeechFilter: string;
  difficultyFilter: string;
}

export function WordsTableClient({
  words,
  totalCount,
  currentPage,
  totalPages,
  search: initialSearch,
  partOfSpeechFilter: initialPos,
  difficultyFilter: initialDiff,
}: WordsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Edit Word Modal State
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [wordForm, setWordForm] = useState({
    word: "",
    meaning: "",
    ipa: "",
    part_of_speech: "",
    example: "",
    difficulty: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Word Modal State
  const [deletingWord, setDeletingWord] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyFilters = (newSearch: string, newPos: string, newDiff: string, newPage: number = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    if (newPos && newPos !== "all") params.set("pos", newPos);
    else params.delete("pos");

    if (newDiff && newDiff !== "all") params.set("diff", newDiff);
    else params.delete("diff");

    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");

    router.push(`/admin/vocabulary-words?${params.toString()}`);
  };

  const handleOpenEdit = (w: any) => {
    setEditingWord(w);
    setWordForm({
      word: w.word || "",
      meaning: w.meaning || "",
      ipa: w.ipa || "",
      part_of_speech: w.part_of_speech || "",
      example: w.example || "",
      difficulty: w.difficulty || "medium",
    });
  };

  const handleUpdateSubmit = async () => {
    if (!editingWord) return;
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      toast.error("Từ vựng và định nghĩa không được để trống");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateVocabWordAction(editingWord.id, wordForm);
      if (res.ok) {
        toast.success(`Đã cập nhật từ vựng "${wordForm.word}"`);
        setEditingWord(null);
        router.refresh();
      } else {
        toast.error("Không thể cập nhật từ vựng");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWord) return;
    setIsDeleting(true);
    try {
      const res = await deleteVocabWordAction(deletingWord.id);
      if (res.ok) {
        toast.success(`Đã xóa từ vựng "${deletingWord.word}"`);
        setDeletingWord(null);
        router.refresh();
      } else {
        toast.error("Không thể xóa từ vựng");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(searchTerm, initialPos, initialDiff, 1);
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo từ tiếng Anh hoặc nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={initialPos}
            onChange={(e) => applyFilters(searchTerm, e.target.value, initialDiff, 1)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả từ loại</option>
            <option value="noun">Danh từ (Noun)</option>
            <option value="verb">Động từ (Verb)</option>
            <option value="adjective">Tính từ (Adjective)</option>
            <option value="adverb">Trạng từ (Adverb)</option>
          </select>

          <select
            value={initialDiff}
            onChange={(e) => applyFilters(searchTerm, initialPos, e.target.value, 1)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Mọi độ khó</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="hard">Khó (Hard)</option>
          </select>
        </div>
      </div>

      {/* Words Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Từ vựng & IPA</th>
                <th className="px-4 py-3">Từ loại</th>
                <th className="px-4 py-3">Định nghĩa & Nghĩa</th>
                <th className="px-4 py-3">Bộ từ vựng</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {words.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy từ vựng nào phù hợp.
                  </td>
                </tr>
              ) : (
                words.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{w.word}</span>
                        <span className="font-mono text-xs text-muted-foreground">{w.ipa || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {w.part_of_speech || "-"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col max-w-[260px]">
                        <span className="font-medium text-foreground truncate">{w.meaning}</span>
                        {w.example && (
                          <span className="text-xs text-muted-foreground italic truncate">
                            "{w.example}"
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {w.vocab_sets ? (
                        <Link
                          href={`/admin/vocabulary-sets/${w.vocab_sets.id}`}
                          className="font-medium text-primary hover:underline truncate max-w-[150px] inline-block"
                        >
                          {w.vocab_sets.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Không rõ</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(w.created_at), "dd/MM/yyyy", { locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(w)}
                          className="h-8 w-8 hover:bg-muted"
                          title="Chỉnh sửa từ"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingWord(w)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Xóa từ"
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
            Hiển thị <strong>{words.length}</strong> / <strong>{totalCount}</strong> từ vựng
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(initialSearch, initialPos, initialDiff, currentPage - 1)}
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
              onClick={() => applyFilters(initialSearch, initialPos, initialDiff, currentPage + 1)}
              className="h-8 text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Word Dialog */}
      <Dialog open={Boolean(editingWord)} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa từ vựng</DialogTitle>
            <DialogDescription>Cập nhật phiên âm, nghĩa tiếng Việt và câu ví dụ minh họa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1">
              <Label>Từ tiếng Anh</Label>
              <Input
                value={wordForm.word}
                onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Phiên âm (IPA)</Label>
                <Input
                  value={wordForm.ipa}
                  placeholder="/.../"
                  onChange={(e) => setWordForm({ ...wordForm, ipa: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Từ loại</Label>
                <Input
                  value={wordForm.part_of_speech}
                  placeholder="noun, verb..."
                  onChange={(e) => setWordForm({ ...wordForm, part_of_speech: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Định nghĩa / Nghĩa tiếng Việt</Label>
              <Input
                value={wordForm.meaning}
                onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Câu ví dụ minh họa</Label>
              <Input
                value={wordForm.example}
                placeholder="Example sentence..."
                onChange={(e) => setWordForm({ ...wordForm, example: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingWord(null)} disabled={isUpdating}>
              Hủy
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={isUpdating}>
              {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Word Dialog */}
      <Dialog open={Boolean(deletingWord)} onOpenChange={(open) => !open && setDeletingWord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa từ vựng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn từ <strong>"{deletingWord?.word}"</strong>? Lịch sử ôn tập liên quan đến từ này cũng sẽ bị gỡ bỏ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingWord(null)} disabled={isDeleting}>
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa từ vựng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
