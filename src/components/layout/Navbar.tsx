"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { StreakBadge } from "@/components/common/StreakBadge";
import { BrandLogo } from "@/components/common/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSidebar } from "@/hooks/use-sidebar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/auth/get-current-user";

interface NavbarProps {
  profile?: UserProfile | null;
}

const ROUTE_TITLES: Array<{ match: (path: string) => boolean; label: string }> = [
  { match: (p) => p === "/u" || p === "/dashboard", label: "Bảng điều khiển" },
  { match: (p) => p.startsWith("/u/dictionary") || p.startsWith("/dictionary"), label: "Từ điển Anh - Việt" },
  { match: (p) => p === "/u/vocabulary/new" || p === "/vocabulary/new", label: "Tạo bộ từ vựng" },
  { match: (p) => p.startsWith("/u/vocabulary/") || p.startsWith("/vocabulary/"), label: "Học bộ từ vựng" },
  { match: (p) => p === "/u/vocabulary" || p === "/vocabulary", label: "Bộ từ vựng" },
  { match: (p) => p.startsWith("/u/vocabulary-management") || p.startsWith("/vocabulary-management"), label: "Kho từ vựng" },
  { match: (p) => p.startsWith("/u/review") || p.startsWith("/review"), label: "Ôn tập SRS" },
  { match: (p) => p.startsWith("/u/reading") || p.startsWith("/reading"), label: "Đọc hiểu song ngữ" },
  { match: (p) => p.startsWith("/u/quiz") || p.startsWith("/quiz"), label: "Trắc nghiệm nhanh" },
  { match: (p) => p.startsWith("/u/ai") || p.startsWith("/ai"), label: "Trợ lý AI" },
  { match: (p) => p.startsWith("/u/statistics") || p.startsWith("/statistics"), label: "Thống kê học tập" },
  { match: (p) => p.startsWith("/u/settings") || p.startsWith("/settings"), label: "Cài đặt" },
  { match: (p) => p.startsWith("/u/notifications") || p.startsWith("/notifications"), label: "Trung tâm thông báo" },
];

export function Navbar({ profile }: NavbarProps) {
  const { toggleMobileOpen } = useSidebar();
  const pathname = usePathname();

  const currentSection = ROUTE_TITLES.find((item) => item.match(pathname))?.label;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={toggleMobileOpen}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Mở menu</span>
          </Button>

          <Link href={ROUTES.DASHBOARD} className="flex items-center">
            <BrandLogo
              className="gap-2"
              imageClassName="h-8 w-8"
              textClassName="text-xl sm:text-2xl"
            />
          </Link>

          {currentSection && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground pl-2 border-l border-border/80">
              <span className="font-medium text-foreground/85">{currentSection}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.REVIEW}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Ôn tập</span>
          </Link>
          <Link
            href={ROUTES.AI}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden lg:inline-flex text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Trợ lý AI</span>
          </Link>
          <StreakBadge profile={profile} />
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
