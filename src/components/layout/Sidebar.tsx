"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookA,
  BookMarked,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  Folder,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Home,
  LucideIcon,
  Plus,
  Settings,
} from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/UserMenu";
import { BrandLogo } from "@/components/common/BrandLogo";
import type { UserProfile } from "@/lib/auth/get-current-user";
import type { NavigationItem } from "@/types/navigation";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Folder,
  BookA,
  BookMarked,
  BookOpen,
  GraduationCap,
  Gamepad2,
  Bot,
  BarChart3,
  Settings,
};

const SidebarIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = ICON_MAP[name] ?? HelpCircle;
  return <IconComponent className={className} />;
};

interface SidebarProps {
  profile?: UserProfile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  return <SidebarContent profile={profile} />;
}

function SidebarContent({ profile }: { profile?: UserProfile | null }) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapse, setMobileOpen } = useSidebar();
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const isActive = (href: string) => {
    if (href === "/u" || href === "/") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderGroup = (
    items: NavigationItem[],
    groupLabel: string,
    closeMobile?: boolean,
    collapsedView?: boolean
  ) => (
    <div className="space-y-1">
      {!collapsedView && (
        <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {groupLabel}
        </div>
      )}
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsedView ? item.title : undefined}
            onClick={() => {
              if (closeMobile) setMobileOpen(false);
            }}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer group",
              collapsedView && "justify-center px-2.5",
              active
                ? "bg-primary/10 text-primary font-semibold dark:bg-primary/15"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary"
              />
            )}
            <SidebarIcon
              name={item.iconName}
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-150",
                active
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsedView && (
              <span className="truncate leading-snug">{item.title}</span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const renderNavContent = (closeMobile?: boolean, collapsedView?: boolean) => (
    <nav className="flex-1 space-y-4 px-3 py-4">
      <div>
        <Link
          href="/u/vocabulary/new"
          onClick={() => {
            if (closeMobile) setMobileOpen(false);
          }}
          title={collapsedView ? "Tạo bộ từ mới" : undefined}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 cursor-pointer",
            collapsedView ? "px-0 h-9 w-9 mx-auto" : "w-full"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsedView && <span>Tạo bộ từ vựng</span>}
        </Link>
      </div>

      {renderGroup(NAVIGATION_ITEMS, "Học tập", closeMobile, collapsedView)}
      {renderGroup(SECONDARY_NAVIGATION_ITEMS, "Công cụ & Phân tích", closeMobile, collapsedView)}
    </nav>
  );

  return (
    <>
      {isMobileViewport && (
        <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 border-r border-sidebar-border bg-sidebar flex flex-col h-full"
          >
            <SheetTitle className="sr-only">Menu điều hướng Vocabee</SheetTitle>
            <div className="flex h-14 items-center border-b border-sidebar-border px-4">
              <Link
                href={ROUTES.DASHBOARD}
                onClick={() => setMobileOpen(false)}
                className="flex items-center"
              >
                <BrandLogo
                  className="gap-2"
                  imageClassName="h-8 w-8"
                  textClassName="text-xl"
                />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNavContent(true, false)}
            </div>
            <div className="p-3 border-t border-sidebar-border bg-muted/15">
              <UserMenu profile={profile} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 shrink-0 h-full sticky top-0 self-start select-none",
          isCollapsed ? "w-[68px]" : "w-60"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {renderNavContent(false, isCollapsed)}
        </div>

        <div className="border-t border-sidebar-border bg-muted/10 p-2.5 space-y-2">
          <div className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}>
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
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
