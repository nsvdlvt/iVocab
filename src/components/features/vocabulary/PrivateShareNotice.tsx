"use client";

import Link from "next/link";
import { Lock, ChevronLeft } from "lucide-react";

interface PrivateShareNoticeProps {
  backHref: string;
}

export function PrivateShareNotice({ backHref }: PrivateShareNoticeProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border bg-card/90 backdrop-blur-sm shadow-xl p-8 text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Bộ từ vựng riêng tư</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bộ từ vựng này hiện không được chia sẻ công khai.
          </p>
        </div>
        <Link
          href={backHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Link>
      </div>
    </div>
  );
}
