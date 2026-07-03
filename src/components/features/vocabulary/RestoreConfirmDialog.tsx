"use client";

import React, { useState } from "react";
import { restoreVocabularySet } from "@/actions/vocab-sets/restore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database } from "@/types/database";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabSet: VocabSetRow | null;
}

export function RestoreConfirmDialog({ open, onOpenChange, vocabSet }: RestoreConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleRestore = async () => {
    if (!vocabSet) return;
    setIsPending(true);
    try {
      const res = await restoreVocabularySet(vocabSet.id);
      if (res.success) {
        toast.success("Khôi phục bộ từ vựng thành công!");
        onOpenChange(false);
      } else {
        toast.error(res.error || "Không thể khôi phục bộ từ.");
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
          <DialogTitle>Khôi phục bộ từ vựng</DialogTitle>
          <DialogDescription className="pt-2">
            Bạn có chắc muốn khôi phục bộ từ vựng &ldquo;{vocabSet?.title}&rdquo;? Nó sẽ hiển thị lại trong danh sách bộ từ vựng đang học của bạn.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button type="button" onClick={handleRestore} disabled={isPending}>
            {isPending ? "Đang xử lý..." : "Khôi phục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
