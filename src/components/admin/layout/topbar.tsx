"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, LayoutDashboard, Shield, Briefcase, ArrowLeftRight } from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/layout/command-palette";
import { AdminMobileNav } from "@/components/admin/layout/mobile-nav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { logoutAction } from "@/actions/auth/logout";
import { ROUTES } from "@/constants/routes";

interface AdminTopbarProps {
  user: { id?: string; email?: string; user_metadata?: { avatar_url?: string; full_name?: string } } | null | undefined;
}

const ROUTE_TITLE_MAP: Record<string, string> = {
  "/admin": "Bảng điều khiển Tổng quan",
  "/admin/analytics": "Phân tích & Báo cáo",
  "/admin/users": "Quản lý Người dùng",
  "/admin/vocabulary-sets": "Quản lý Bộ từ vựng",
  "/admin/vocabulary-words": "Kho Từ vựng Toàn cục",
  "/admin/public-library": "Thư viện Khám phá",
  "/admin/community-vocabulary": "Từ vựng Cộng đồng",
  "/admin/srs": "Tiến độ Học & Spaced Repetition",
  "/admin/quizzes": "Kiểm tra & Bài tập",
  "/admin/reading": "Nội dung Đọc Song ngữ",
  "/admin/reading/new": "Tạo Bài đọc Mới",
  "/admin/leaderboard": "Bảng xếp hạng Học tập",
  "/admin/ai": "Trung tâm AI & Đo lường",
  "/admin/prompts": "Quản lý Prompts Hệ thống",
  "/admin/dictionary": "Từ điển & Bộ nhớ đệm",
  "/admin/content-quality": "Kiểm tra Chất lượng Dữ liệu",
  "/admin/announcements": "Thông báo & Tin nhắn",
  "/admin/feature-flags": "Tính năng & Chế độ Bảo trì",
  "/admin/settings": "Cài đặt & Cấu hình Nền tảng",
  "/admin/logs": "Nhật ký Hệ thống & Sức khỏe",
};

export function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const title = ROUTE_TITLE_MAP[pathname] || (() => {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  })();

  const handleLogout = async () => {
    try {
      const result = await logoutAction();
      window.location.replace(result?.redirectTo || ROUTES.LOGIN);
    } catch {
      window.location.replace(ROUTES.LOGIN);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6 shrink-0 z-20">
      <div className="flex items-center gap-3">
        <AdminMobileNav />
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
            <Shield className="h-3 w-3 text-[#f9971d]" />
            <span>Khu vực Quản trị viên Vocabee</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:block">
          <AdminCommandPalette />
        </div>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "flex items-center gap-2 px-2 rounded-full cursor-pointer hover:bg-muted"
            )}
          >
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-[#030f31] text-[#f9971d] font-bold text-xs">
                {user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium hidden md:inline-block max-w-[120px] truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <div className="px-1.5 py-1">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.user_metadata?.full_name || "Quản trị viên"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(ROUTES.SELECT_WORKSPACE)}>
              <div className="flex items-center gap-2 cursor-pointer w-full text-primary font-medium">
                <ArrowLeftRight className="h-4 w-4" />
                <span>Chuyển đổi không gian</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(ROUTES.DASHBOARD)}>
              <div className="flex items-center gap-2 cursor-pointer w-full">
                <LayoutDashboard className="h-4 w-4" />
                <span>Không gian Vocabeer</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(ROUTES.ETEAM_DASHBOARD)}>
              <div className="flex items-center gap-2 cursor-pointer w-full text-purple-600 dark:text-purple-400">
                <Briefcase className="h-4 w-4" />
                <span>Không gian E-Team</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              <div className="flex items-center gap-2 cursor-pointer w-full">
                <Settings className="h-4 w-4" />
                <span>Cài đặt hệ thống</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
