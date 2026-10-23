"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Menu } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function ETeamBottomNav() {
  const pathname = usePathname();
  const { isMobileOpen, toggleMobileOpen } = useSidebar();

  const isHomeActive =
    pathname === ROUTES.ETEAM_DASHBOARD ||
    pathname === ROUTES.ETEAM ||
    pathname === "/e-team";

  const isVocabsActive =
    pathname === ROUTES.ETEAM_VOCABS ||
    pathname.startsWith(`${ROUTES.ETEAM_VOCABS}/`);

  return (
    <nav
      aria-label="Điều hướng di động E-Team"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1"
    >
      <div className="grid grid-cols-3 h-14 items-center px-2 max-w-lg mx-auto">
        {/* 1. Trang chủ */}
        <Link
          href={ROUTES.ETEAM_DASHBOARD}
          aria-label="Trang chủ E-Team"
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full min-h-[44px] rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-95",
            isHomeActive
              ? "text-purple-600 dark:text-purple-400 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full p-1 transition-transform duration-150",
              isHomeActive &&
                "scale-110 bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400"
            )}
          >
            <Home className="h-5 w-5 shrink-0" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">Trang chủ</span>
        </Link>

        {/* 2. Học từ vựng */}
        <Link
          href={ROUTES.ETEAM_VOCABS}
          aria-label="Học từ vựng E-Team"
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full min-h-[44px] rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-95",
            isVocabsActive
              ? "text-purple-600 dark:text-purple-400 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full p-1 transition-transform duration-150",
              isVocabsActive &&
                "scale-110 bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400"
            )}
          >
            <BookOpen className="h-5 w-5 shrink-0" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">Học từ vựng</span>
        </Link>

        {/* 3. Menu (opens drawer) */}
        <button
          type="button"
          onClick={toggleMobileOpen}
          aria-label="Mở menu điều hướng E-Team"
          aria-expanded={isMobileOpen}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full min-h-[44px] rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-95",
            isMobileOpen
              ? "text-purple-600 dark:text-purple-400 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full p-1 transition-transform duration-150",
              isMobileOpen &&
                "scale-110 bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400"
            )}
          >
            <Menu className="h-5 w-5 shrink-0" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
