"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { restoreVocabularySet } from "@/actions/vocab-sets/restore";
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

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabSet: VocabSetRow | null;
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  vocabSet,
}: RestoreConfirmDialogProps) {
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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isPending) onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md w-[95%] rounded-xl border-border/80 p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Khôi phục bộ từ vựng
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Bạn có chắc muốn khôi phục bộ từ vựng{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{vocabSet?.title}&rdquo;
            </span>
            ? Bộ từ sẽ xuất hiện trở lại trong thư viện học tập của bạn.
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
          <Button type="button" onClick={handleRestore} disabled={isPending}>
            {isPending ? "Đang xử lý..." : "Khôi phục bộ từ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
