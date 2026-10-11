"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteVocabularySet } from "@/actions/vocab-sets/delete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  vocabSet,
  isPermanent,
}: DeleteConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (!vocabSet) return;
    setIsPending(true);
    try {
      const res = await deleteVocabularySet(vocabSet.id, isPermanent);
      if (res.success) {
        toast.success(
          isPermanent
            ? "Đã xóa vĩnh viễn bộ từ vựng!"
            : "Đã chuyển bộ từ vựng vào thùng rác."
        );
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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isPending) onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md w-[95%] rounded-xl border-border/80 p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              {isPermanent ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {isPermanent ? "Xóa vĩnh viễn bộ từ vựng" : "Chuyển vào thùng rác"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {isPermanent ? (
              <>
                Bộ từ vựng{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{vocabSet?.title}&rdquo;
                </span>{" "}
                cùng toàn bộ từ vựng, lịch sử ôn tập và tiến độ SRS liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </>
            ) : (
              <>
                Bộ từ vựng{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{vocabSet?.title}&rdquo;
                </span>{" "}
                sẽ được chuyển vào mục Đã xóa tạm thời. Bạn có thể khôi phục lại bất cứ lúc nào.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending
              ? "Đang xử lý..."
              : isPermanent
                ? "Xóa vĩnh viễn"
                : "Chuyển vào thùng rác"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
