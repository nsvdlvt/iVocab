import React from "react";
import Link from "next/link";
import { Compass, Home, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-7 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Compass className="h-7 w-7" />
        </div>

        <div className="mt-5 space-y-2">
          <Badge variant="secondary" className="mx-auto font-mono">
            Mã lỗi 404
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Đường dẫn bạn truy cập không tồn tại, đã được đổi tên hoặc chuyển sang một khu vực khác trên Vocabee.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.LANDING}
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-xl px-5 font-semibold"
            )}
          >
            <Home className="mr-1.5 h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href={ROUTES.DASHBOARD}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl px-5 font-semibold"
            )}
          >
            <LayoutDashboard className="mr-1.5 h-4 w-4" />
            Bảng điều khiển
          </Link>
        </div>
      </div>
    </main>
  );
}
