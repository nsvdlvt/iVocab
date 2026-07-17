import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="space-y-2">
        <span className="text-8xl font-extrabold text-primary/20">404</span>
        <h2 className="text-2xl font-bold tracking-tight">
          Không tìm thấy trang yêu cầu
        </h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển sang một địa chỉ khác.
        </p>
      </div>
      <Link href={ROUTES.LANDING} className={buttonVariants({ variant: "default", className: "rounded-xl cursor-pointer shadow-sm" })}>
        Quay lại Trang chủ
      </Link>
    </div>
  );
}
