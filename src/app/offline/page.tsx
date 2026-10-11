import React from "react";
import Link from "next/link";
import { Home, WifiOff } from "lucide-react";
import { OfflineRetryButton } from "@/components/pwa/OfflineRetryButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Ngoại tuyến | Vocabee",
  description: "Bạn đang ngoại tuyến. Vocabee sẽ sẵn sàng trở lại khi có kết nối.",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-7 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <WifiOff className="h-7 w-7" />
        </div>

        <div className="mt-5 space-y-2">
          <Badge variant="info" className="mx-auto">
            Mất kết nối mạng
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bạn đang ở chế độ ngoại tuyến
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vocabee cần kết nối Internet để đồng bộ dữ liệu từ vựng và tiến độ ôn tập. Hãy kiểm tra đường truyền mạng và thử lại.
          </p>
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <OfflineRetryButton />
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
