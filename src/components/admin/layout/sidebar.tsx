"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Library,
  BookA,
  Globe2,
  BrainCircuit,
  Bot,
  MessageSquareCode,
  BookOpenText,
  BarChart3,
  ShieldCheck,
  Megaphone,
  ToggleLeft,
  Settings,
  TerminalSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Vocabulary Sets", href: "/admin/vocabulary-sets", icon: Library },
  { title: "Vocabulary Words", href: "/admin/vocabulary-words", icon: BookA },
  { title: "Public Library", href: "/admin/public-library", icon: Globe2 },
  { title: "SRS Center", href: "/admin/srs", icon: BrainCircuit },
  { title: "AI Center", href: "/admin/ai", icon: Bot },
  { title: "Prompt Manager", href: "/admin/prompts", icon: MessageSquareCode },
  { title: "Dictionary Center", href: "/admin/dictionary", icon: BookOpenText },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Content Quality", href: "/admin/content-quality", icon: ShieldCheck },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Feature Flags", href: "/admin/feature-flags", icon: ToggleLeft },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "System Logs", href: "/admin/logs", icon: TerminalSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen border-r bg-card transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className="flex h-14 items-center border-b px-4 py-4 sticky top-0 shrink-0">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
            V
          </div>
          {!isCollapsed && <span className="text-xl tracking-tight">Admin</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-4 h-8 w-8 rounded-full border bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <nav className="grid gap-1 px-2">
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
            
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t p-4 shrink-0">
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start", isCollapsed && "justify-center px-0")}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Back to App"}
        </Link>
      </div>
    </div>
  );
}
