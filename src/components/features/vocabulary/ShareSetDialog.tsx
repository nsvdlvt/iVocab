"use client";

import React from "react";
import { Copy, Link2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ShareSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: string;
  visibility: "public" | "private" | "unlisted" | null | undefined;
}

export function ShareSetDialog({ open, onOpenChange, shareLink, visibility }: ShareSetDialogProps) {
  const isPublic = visibility === "public";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Đã sao chép liên kết.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Chia sẻ bộ từ vựng</DialogTitle>
              <DialogDescription className="text-xs">
                Liên kết này cho phép người khác mở bộ từ vựng theo trạng thái hiển thị hiện tại.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Liên kết chia sẻ</span>
              <Badge variant="outline" className="gap-1">
                {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {isPublic ? "Công khai" : "Riêng tư"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="rounded-xl text-xs" />
              <Button onClick={handleCopy} variant="outline" className="rounded-xl gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button onClick={() => onOpenChange(false)} className="rounded-xl">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
