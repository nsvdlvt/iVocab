"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/common/BrandLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import type { UserProfile } from "@/lib/auth/get-current-user";
import { ROUTES } from "@/constants/routes";

interface ETeamSidebarProps {
  profile?: UserProfile | null;
}

export function ETeamSidebar({ profile }: ETeamSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: ROUTES.ETEAM_DASHBOARD,
      icon: LayoutDashboard,
      isActive: pathname === ROUTES.ETEAM_DASHBOARD || pathname === ROUTES.ETEAM,
    },
    {
      title: "Học từ vựng",
      href: ROUTES.ETEAM_VOCABS,
      icon: BookOpen,
      isActive: pathname.startsWith(ROUTES.ETEAM_VOCABS),
    },
  ];

  const renderNavList = (closeMobile?: boolean, collapsedView?: boolean) => (
    <nav className="flex-1 space-y-1.5 px-3 py-4">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        {!collapsedView && <span>Không gian làm việc</span>}
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsedView ? item.title : undefined}
            onClick={() => {
              if (closeMobile) setMobileOpen(false);
            }}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group",
              collapsedView && "justify-center px-2.5",
              item.isActive
                ? "bg-purple-600/10 text-purple-600 dark:text-purple-400 font-semibold dark:bg-purple-600/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {item.isActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-purple-600 dark:bg-purple-400"
              />
            )}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-150",
                item.isActive
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsedView && (
              <span className="truncate leading-snug">{item.title}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobileViewport && (
        <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 border-r border-border bg-card flex flex-col h-full"
          >
            <SheetTitle className="sr-only">Menu điều hướng E-Team</SheetTitle>
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Link
                href={ROUTES.ETEAM_DASHBOARD}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                <BrandLogo
                  className="gap-2"
                  imageClassName="h-8 w-8"
                  textClassName="text-xl"
                />
              </Link>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Briefcase className="h-3 w-3" />
                E-Team
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNavList(true, false)}
            </div>

            <div className="p-3 border-t border-border bg-muted/20">
              <UserMenu profile={profile} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 h-full sticky top-0 self-start select-none z-30",
          isCollapsed ? "w-[68px]" : "w-60"
        )}
      >
        {/* Workspace Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
          <Link
            href={ROUTES.ETEAM_DASHBOARD}
            className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}
          >
            <BrandLogo
              className="gap-2"
              imageClassName="h-7 w-7"
              textClassName={isCollapsed ? "hidden" : "text-lg"}
            />
          </Link>
          {!isCollapsed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Workspace
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {renderNavList(false, isCollapsed)}
        </div>

        {/* Footer Collapse and Account */}
        <div className="border-t border-border bg-muted/10 p-2.5 space-y-2">
          <div className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <UserMenu profile={profile} collapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
