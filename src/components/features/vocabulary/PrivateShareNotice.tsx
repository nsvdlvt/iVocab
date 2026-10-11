"use client";

import Link from "next/link";
import { Lock, ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrivateShareNoticeProps {
  backHref: string;
}

export function PrivateShareNotice({ backHref }: PrivateShareNoticeProps) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Bộ từ vựng riêng tư
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Bộ từ vựng này hiện đang ở chế độ riêng tư hoặc không còn tồn tại. Vui lòng liên hệ chủ sở hữu để được cấp quyền truy cập.
          </p>
        </div>
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "default" }),
            "gap-1.5 rounded-lg"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Quay lại</span>
        </Link>
      </div>
    </div>
  );
}
