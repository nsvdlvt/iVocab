"use client";

import React, { useState } from "react";
import { Copy, Check, Link2, Lock, Globe, Share2 } from "lucide-react";
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
import { ROUTES } from "@/constants/routes";

interface ShareSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: string;
  visibility: "public" | "private" | "unlisted" | null | undefined;
}

export function ShareSetDialog({
  open,
  onOpenChange,
  shareLink,
  visibility,
}: ShareSetDialogProps) {
  const [copied, setCopied] = useState(false);
  const isShareable = visibility === "public" || visibility === "unlisted";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Đã sao chép liên kết chia sẻ.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-xl border-border/80 p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                Chia sẻ bộ từ vựng
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sao chép liên kết bên dưới để gửi cho bạn bè hoặc học viên.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Liên kết chia sẻ</span>
              <Badge
                variant={isShareable ? "success" : "secondary"}
                className="gap-1"
              >
                {isShareable ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {visibility === "public"
                  ? "Công khai"
                  : visibility === "unlisted"
                    ? "Không công khai"
                    : "Riêng tư"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="h-9 rounded-lg font-mono text-xs bg-muted/40"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5 rounded-lg px-3"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>

          {!isShareable && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              Bộ từ vựng đang ở chế độ <strong>Riêng tư</strong>. Hãy chuyển sang{" "}
              <strong>Công khai</strong> trong phần Chỉnh sửa để người khác có thể truy cập liên kết này.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="secondary"
            className="w-full sm:w-auto rounded-lg"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ShareSetTriggerButtonProps {
  setId: string;
  visibility: "public" | "private" | "unlisted" | null | undefined;
}

export function ShareSetTriggerButton({
  setId,
  visibility,
}: ShareSetTriggerButtonProps) {
  const [open, setOpen] = useState(false);
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.SHARE_VOCABULARY_DETAIL(setId)}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-medium"
      >
        <Share2 className="h-4 w-4" />
        <span>Chia sẻ</span>
      </Button>
      <ShareSetDialog
        open={open}
        onOpenChange={setOpen}
        shareLink={shareLink}
        visibility={visibility}
      />
    </>
  );
}
