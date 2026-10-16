import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "403 - Không có quyền truy cập",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-7 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="mt-5 space-y-2">
          <Badge variant="warning" className="mx-auto font-mono">
            Mã lỗi 403
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Không có quyền truy cập
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tài khoản của bạn hiện không được cấp quyền truy cập vào khu vực này. Hãy quay lại bảng điều khiển hoặc đăng nhập bằng tài khoản phù hợp.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.DASHBOARD}
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-xl px-5 font-semibold"
            )}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Về Bảng điều khiển
          </Link>
          <Link
            href={ROUTES.LANDING}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl px-5 font-semibold"
            )}
          >
            <Home className="mr-1.5 h-4 w-4" />
            Trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
