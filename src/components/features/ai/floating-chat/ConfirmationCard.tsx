// src/components/features/ai/floating-chat/ConfirmationCard.tsx
"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingConfirmation } from "@/lib/ai/agent/types";

interface ConfirmationCardProps {
  confirmation: PendingConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationCard({
  confirmation,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationCardProps) {
  const isPending = confirmation.status === "pending";
  const isConfirmed = confirmation.status === "confirmed";
  const isCancelled = confirmation.status === "cancelled";

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 text-card-foreground shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive animate-pulse" />
        <span className="text-xs font-bold text-destructive tracking-wide uppercase">
          {confirmation.title}
        </span>
      </div>

      {/* Body Details */}
      <div className="p-3.5 space-y-2.5 text-xs">
        <div className="grid grid-cols-[90px_1fr] gap-1.5">
          <span className="text-muted-foreground font-medium">Đối tượng:</span>
          <span className="font-semibold text-foreground">{confirmation.targetName}</span>
        </div>

        <div className="grid grid-cols-[90px_1fr] gap-1.5">
          <span className="text-muted-foreground font-medium">Phạm vi:</span>
          <span className="text-foreground">{confirmation.affectedSummary}</span>
        </div>

        <div className="grid grid-cols-[90px_1fr] gap-1.5 rounded-lg bg-destructive/10 p-2">
          <span className="text-destructive font-semibold">Sẽ xóa bỏ:</span>
          <span className="text-destructive font-medium leading-relaxed">
            {confirmation.deletedSummary}
          </span>
        </div>

        <div className="grid grid-cols-[90px_1fr] gap-1.5 rounded-lg bg-emerald-500/10 p-2">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Giữ nguyên:</span>
          <span className="text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
            {confirmation.retainedSummary}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-destructive/20 bg-background/50 px-3.5 py-2.5">
        {isPending && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onCancel}
              className="h-7 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isLoading}
              onClick={onConfirm}
              className="h-7 text-xs px-3 gap-1.5 font-semibold cursor-pointer shadow-sm hover:shadow"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xác nhận thực hiện
            </Button>
          </>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã thực hiện thành công</span>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>Đã hủy thao tác</span>
          </div>
        )}
      </div>
    </div>
  );
}
