"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Megaphone, BookPlus, Download, DatabaseZap, Bot } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearDictionaryCacheAction } from "@/actions/admin/dictionary";
import { toast } from "sonner";

export function QuickActions() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const res = await clearDictionaryCacheAction();
      if (res.ok) {
        toast.success(res.message);
      }
    } catch {
      toast.error("Không thể làm sạch bộ nhớ đệm");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Thao tác Nhanh
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/admin/content-quality"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-[#f9971d] hover:bg-amber-500/5"
          )}
        >
          <ShieldCheck className="h-5 w-5 text-[#f9971d]" />
          <span className="text-xs font-semibold text-center leading-tight">Soát lỗi Dữ liệu</span>
        </Link>

        <Link
          href="/admin/announcements"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-blue-500 hover:bg-blue-500/5"
          )}
        >
          <Megaphone className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-semibold text-center leading-tight">Tạo Thông báo</span>
        </Link>

        <Link
          href="/admin/reading/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-purple-500 hover:bg-purple-500/5"
          )}
        >
          <BookPlus className="h-5 w-5 text-purple-500" />
          <span className="text-xs font-semibold text-center leading-tight">Thêm Bài đọc</span>
        </Link>

        <Link
          href="/admin/analytics"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-emerald-500 hover:bg-emerald-500/5"
          )}
        >
          <Download className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-semibold text-center leading-tight">Xuất Báo cáo</span>
        </Link>

        <Button
          variant="outline"
          onClick={handleClearCache}
          disabled={isClearing}
          className="h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-cyan-500 hover:bg-cyan-500/5"
        >
          <DatabaseZap className="h-5 w-5 text-cyan-500" />
          <span className="text-xs font-semibold text-center leading-tight">
            {isClearing ? "Đang xóa..." : "Xóa Cache Từ điển"}
          </span>
        </Button>

        <Link
          href="/admin/ai"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-18 flex flex-col items-center justify-center gap-1.5 p-2 shadow-xs hover:border-pink-500 hover:bg-pink-500/5"
          )}
        >
          <Bot className="h-5 w-5 text-pink-500" />
          <span className="text-xs font-semibold text-center leading-tight">Kiểm tra AI</span>
        </Link>
      </div>
    </div>
  );
}
