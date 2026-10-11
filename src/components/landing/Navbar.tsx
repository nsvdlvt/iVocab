"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const navItems = [
  { label: "Tính năng", href: "#features" },
  { label: "Trải nghiệm", href: "#showcase" },
  { label: "Lộ trình học", href: "#workflow" },
  { label: "Hỏi đáp", href: "#faq" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:px-6 lg:px-8">
        <Link href={ROUTES.LANDING} className="inline-flex items-center focus-visible:outline-none">
          <BrandLogo
            imageClassName="h-9 w-9 sm:h-10 sm:w-10"
            textClassName="scale-[0.85] sm:scale-[0.9] origin-left"
          />
        </Link>

        <nav aria-label="Điều hướng trang chủ" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" className="rounded-xl px-4 font-semibold text-foreground">
              Đăng nhập
            </Button>
          </Link>
          <Link href={ROUTES.REGISTER}>
            <Button className="rounded-xl px-5 font-semibold shadow-xs">
              Bắt đầu miễn phí
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm" className="rounded-lg px-2.5 font-semibold">
              Đăng nhập
            </Button>
          </Link>
          <Link href={ROUTES.REGISTER}>
            <Button size="sm" className="rounded-lg px-3 font-semibold shadow-xs">
              Đăng ký
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            aria-label={mobileOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileOpen && (
        <div className="border-t border-border/80 bg-card/95 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-1" aria-label="Menu di động">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-border/80 pt-4">
            <Link href={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl font-semibold">
                Đăng nhập
              </Button>
            </Link>
            <Link href={ROUTES.REGISTER} onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-xl font-semibold">
                Bắt đầu miễn phí
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
