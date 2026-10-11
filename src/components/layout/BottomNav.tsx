"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Folder, GraduationCap, Home, Menu } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const HIDDEN_PATH_PATTERNS = [
  "/flashcard",
  "/learn",
  "/dictation",
  "/sentence",
  "/ai-quiz",
  "/review/session/",
];

export function BottomNav() {
  const pathname = usePathname();
  const { toggleMobileOpen } = useSidebar();

  // Hide bottom navigation during distraction-free study sessions
  const isStudyMode = HIDDEN_PATH_PATTERNS.some((pattern) =>
    pathname.includes(pattern)
  );

  if (isStudyMode) {
    return null;
  }

  const navItems = [
    {
      label: "Trang chủ",
      href: ROUTES.DASHBOARD,
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Bộ từ",
      href: ROUTES.VOCABULARY,
      icon: Folder,
      isActive:
        pathname === "/vocabulary" ||
        (pathname.startsWith("/vocabulary/") &&
          !pathname.startsWith("/vocabulary/new") &&
          !pathname.includes("/edit")),
    },
    {
      label: "Ôn tập",
      href: ROUTES.REVIEW,
      icon: GraduationCap,
      isActive: pathname.startsWith("/review"),
    },
    {
      label: "Bài đọc",
      href: ROUTES.READING,
      icon: BookOpen,
      isActive: pathname.startsWith("/reading"),
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full min-h-[44px] rounded-xl transition-all duration-150 cursor-pointer select-none",
                item.isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full p-1 transition-transform",
                  item.isActive && "scale-110 bg-primary/10 dark:bg-primary/20"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu toggle for secondary navigation (AI, Quiz, Stats, Settings) */}
        <button
          type="button"
          onClick={toggleMobileOpen}
          className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer select-none"
          aria-label="Mở menu mở rộng"
        >
          <div className="flex items-center justify-center rounded-full p-1">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">Thêm</span>
        </button>
      </div>
    </nav>
  );
}
