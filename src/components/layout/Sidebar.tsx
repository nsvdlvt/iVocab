"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, HelpCircle, LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { NAVIGATION_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/UserMenu";

const SidebarIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[name];
  if (!IconComponent) return <HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapse, setMobileOpen } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const renderNavLinks = (closeMobile?: boolean) => {
    return (
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {NAVIGATION_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (closeMobile) setMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer group",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <SidebarIcon
                name={item.iconName}
                className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-current" : "text-muted-foreground")}
              />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden",
                  isCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100 w-auto"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* 1. Mobile Sidebar Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-full">
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
            <SheetTitle className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-lg font-extrabold tracking-wider text-transparent">
              VOCABEE
            </SheetTitle>
          </div>
          {renderNavLinks(true)}
          
          {/* User profile dropdown in Mobile Drawer */}
          <div className="p-4 border-t border-sidebar-border bg-muted/10">
            <UserMenu />
          </div>
        </SheetContent>
      </Sheet>

      {/* 2. Desktop & Tablet Fixed Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0 h-[calc(100vh-4rem)] sticky top-16",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Navigation list */}
        {renderNavLinks(false)}

        {/* User profile dropdown at the bottom of the Desktop Sidebar */}
        <div className="p-3 border-t border-border bg-muted/10">
          <UserMenu />
        </div>

        {/* Collapse toggle button at bottom - only visible on desktop screen size */}
        <div className="hidden lg:flex p-4 border-t border-border justify-end">
          <button
            onClick={toggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
