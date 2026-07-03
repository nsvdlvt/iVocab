"use client";

import React, { useState } from "react";
import { deleteVocabularySet } from "@/actions/vocab-sets/delete";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database } from "@/types/database";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabSet: VocabSetRow | null;
  isPermanent: boolean;
}

export function DeleteConfirmDialog({ open, onOpenChange, vocabSet, isPermanent }: DeleteConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (!vocabSet) return;
    setIsPending(true);
    try {
      const res = await deleteVocabularySet(vocabSet.id, isPermanent);
      if (res.success) {
        toast.success(isPermanent ? "Đã xóa vĩnh viễn bộ từ vựng!" : "Đã chuyển bộ từ vựng vào Thùng rác.");
        onOpenChange(false);
      } else {
        toast.error(res.error || "Không thể thực hiện yêu cầu.");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isPending) onOpenChange(val); }}>
      <DialogContent className="max-w-md w-[95%] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-rose-600">
            {isPermanent ? "Xác nhận xóa vĩnh viễn" : "Xác nhận xóa bộ từ vựng"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isPermanent ? (
              <span className="text-rose-500 font-medium block">
                Cảnh báo: Hành động này sẽ xóa vĩnh viễn bộ từ vựng &ldquo;{vocabSet?.title}&rdquo; cùng với tất cả từ vựng bên trong và không thể khôi phục lại!
              </span>
            ) : (
              <span>
                Bạn có chắc chắn muốn xóa bộ từ vựng &ldquo;{vocabSet?.title}&rdquo;? Bạn có thể khôi phục lại bộ từ này từ mục lưu trữ đã xóa tạm thời bất cứ lúc nào.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xử lý..." : isPermanent ? "Xóa vĩnh viễn" : "Xóa tạm thời"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
