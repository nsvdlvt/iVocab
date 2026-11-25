// src/components/features/ai/floating-chat/ConfirmationCard.tsx
"use client";

import React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PendingConfirmation } from "@/lib/ai/agent/types";

interface ConfirmationCardProps {
  confirmation: PendingConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}

export function ConfirmationCard({
  confirmation,
  onConfirm,
  onCancel,
  isBusy = false,
}: ConfirmationCardProps) {
  const isDestructive =
    confirmation.action === "delete_vocabulary_set" ||
    confirmation.action === "delete_vocabulary_word";

  const isPending = confirmation.status === "pending";
  const isConfirmed = confirmation.status === "confirmed";
  const isCancelled = confirmation.status === "cancelled";
  const isFailed = confirmation.status === "failed";

  return (
    <div
      className={cn(
        "mt-2.5 overflow-hidden rounded-xl border text-card-foreground shadow-xs",
        isDestructive
          ? "border-destructive/35 bg-destructive/5"
          : "border-primary/25 bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-3.5 py-2",
          isDestructive
            ? "border-destructive/20 bg-destructive/10 text-destructive"
            : "border-primary/15 bg-primary/10 text-primary"
        )}
      >
        {isDestructive ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : (
          <ShieldAlert className="h-4 w-4 shrink-0" />
        )}
        <span className="text-xs font-semibold">{confirmation.title}</span>
      </div>

      <div className="p-3 space-y-2 text-xs">
        <p className="text-foreground font-medium leading-relaxed">
          {confirmation.description}
        </p>

        <div className="grid grid-cols-[84px_1fr] gap-1.5 rounded-lg bg-background/70 px-2.5 py-1.5 border border-border/60">
          <span className="text-muted-foreground">Đối tượng:</span>
          <span className="font-semibold text-foreground break-words">
            {confirmation.targetName}
          </span>
          <span className="text-muted-foreground">Phạm vi:</span>
          <span className="text-foreground">{confirmation.affectedSummary}</span>
        </div>

        {confirmation.previewItems && confirmation.previewItems.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-background/70 p-2 space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">
              Xem trước ({confirmation.previewItems.length}):
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {confirmation.previewItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-baseline justify-between gap-2 text-[11px]"
                >
                  <span className="font-semibold text-foreground truncate">
                    {item.label}
                  </span>
                  {item.detail && (
                    <span className="text-muted-foreground truncate max-w-[60%] text-right">
                      {item.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmation.consequences.length > 0 && (
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
            {confirmation.consequences.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-background/60 px-3 py-2">
        {isPending && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={onCancel}
              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant={isDestructive ? "destructive" : "default"}
              size="sm"
              disabled={isBusy}
              onClick={onConfirm}
              className="h-7 px-3 text-xs gap-1.5 font-semibold cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Xác nhận
            </Button>
          </>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{confirmation.executedMessage || "Đã thực hiện thành công"}</span>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{confirmation.executedMessage || "Đã hủy thao tác"}</span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{confirmation.executedMessage || "Thực thi thất bại"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
