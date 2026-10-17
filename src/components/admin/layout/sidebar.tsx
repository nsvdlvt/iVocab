"use client";

import Link from "next/link";
import Image from "next/image";
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
  LibraryBig,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  BookOpen,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export interface NavGroup {
  groupName: string;
  items: Array<{
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupName: "Tổng quan",
    items: [
      { title: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard },
      { title: "Phân tích & Báo cáo", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    groupName: "Người dùng & Nội dung",
    items: [
      { title: "Quản lý Người dùng", href: "/admin/users", icon: Users },
      { title: "Bộ từ vựng", href: "/admin/vocabulary-sets", icon: Library },
      { title: "Kho từ vựng", href: "/admin/vocabulary-words", icon: BookA },
      { title: "Thư viện khám phá", href: "/admin/public-library", icon: Globe2 },
      { title: "Từ vựng Cộng đồng", href: "/admin/community-vocabulary", icon: LibraryBig },
      { title: "Tiến độ & SRS", href: "/admin/srs", icon: BrainCircuit },
      { title: "Kiểm tra & Bài tập", href: "/admin/quizzes", icon: HelpCircle },
      { title: "Đọc song ngữ", href: "/admin/reading", icon: BookOpen },
      { title: "Bảng xếp hạng", href: "/admin/leaderboard", icon: Trophy },
    ],
  },
  {
    groupName: "AI & Kiểm duyệt chất lượng",
    items: [
      { title: "Trung tâm AI", href: "/admin/ai", icon: Bot },
      { title: "Quản lý Prompts", href: "/admin/prompts", icon: MessageSquareCode },
      { title: "Từ điển & Cache", href: "/admin/dictionary", icon: BookOpenText },
      { title: "Kiểm tra Chất lượng", href: "/admin/content-quality", icon: ShieldCheck },
    ],
  },
  {
    groupName: "Quản trị nền tảng",
    items: [
      { title: "Thông báo & Tin nhắn", href: "/admin/announcements", icon: Megaphone },
      { title: "Tính năng (Flags)", href: "/admin/feature-flags", icon: ToggleLeft },
      { title: "Cấu hình hệ thống", href: "/admin/settings", icon: Settings },
      { title: "Nhật ký & Sức khỏe", href: "/admin/logs", icon: TerminalSquare },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col h-screen border-r bg-[#030f31] text-slate-200 transition-all duration-300 z-30 shrink-0 select-none",
        isCollapsed ? "w-[72px]" : "w-[270px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-3.5 sticky top-0 shrink-0 bg-[#030f31] z-10">
        <Link href="/admin" className="flex items-center gap-3 font-semibold min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#f9971d] flex items-center justify-center shrink-0 shadow-md p-1.5">
            <Image src="/Vocabee.png" alt="Vocabee" width={24} height={24} className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-bold tracking-tight text-white">Vocabee Admin</span>
              <span className="text-[11px] text-[#f9971d] font-medium uppercase tracking-wider">Console v2.0</span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className="h-7 w-7 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.groupName}
              </div>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group",
                      isActive
                        ? "bg-[#f9971d] text-[#030f31] font-semibold shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-[#030f31]" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#030f31]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Return Link */}
      <div className="border-t border-slate-800 p-3 shrink-0 bg-[#030f31]">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/60",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span className="truncate">Quay lại Ứng dụng</span>}
        </Link>
      </div>
    </aside>
  );
}
