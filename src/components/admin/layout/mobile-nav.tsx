"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ADMIN_NAV_GROUPS } from "./sidebar";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Mở menu quản trị"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 text-foreground"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-[#030f31] text-slate-200 z-50 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-[#f9971d] flex items-center justify-center shrink-0 p-1">
                  <Image src="/Vocabee.png" alt="Vocabee" width={22} height={22} className="object-contain" priority />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white">Vocabee Admin</span>
                  <span className="text-[10px] text-[#f9971d] font-medium uppercase tracking-wider">Console v2.0</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
              {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.groupName}
                  </div>
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
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-[#f9971d] text-[#030f31] font-semibold"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 p-4 shrink-0">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/60"
                )}
              >
                <LogOut className="h-4 w-4 mr-2 shrink-0" />
                Quay lại Ứng dụng
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
