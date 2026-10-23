"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-7 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="mt-5 space-y-2">
          <Badge variant="destructive" className="mx-auto">
            Sự cố gián đoạn tạm thời
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Đã xảy ra lỗi khi tải trang
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hệ thống gặp sự cố ngoài ý muốn trong quá trình xử lý yêu cầu. Dữ liệu học tập của bạn vẫn được bảo toàn.
          </p>
          {error?.digest && (
            <p className="pt-1 font-mono text-[11px] text-muted-foreground/80">
              Mã tham chiếu: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="rounded-xl px-5 font-semibold">
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Thử lại ngay
          </Button>
          <Link
            href={ROUTES.LANDING}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl px-5 font-semibold"
            )}
          >
            <Home className="mr-1.5 h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
