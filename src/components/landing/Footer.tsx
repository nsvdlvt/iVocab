"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ROUTES } from "@/constants/routes";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link href={ROUTES.LANDING} className="inline-flex items-center">
            <BrandLogo imageClassName="h-8 w-8" textClassName="scale-[0.8] origin-left" />
          </Link>
          <span className="text-xs sm:text-sm text-muted-foreground">
            Nền tảng học từ vựng thông minh với Spaced Repetition & AI.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <a href="#features" className="transition-colors hover:text-foreground">
            Tính năng
          </a>
          <a href="#showcase" className="transition-colors hover:text-foreground">
            Trải nghiệm
          </a>
          <Link href={ROUTES.LOGIN} className="transition-colors hover:text-foreground">
            Đăng nhập
          </Link>
          <Link href={ROUTES.REGISTER} className="transition-colors hover:text-foreground">
            Đăng ký
          </Link>
          <Link href={ROUTES.DASHBOARD} className="transition-colors hover:text-foreground">
            Bảng điều khiển
          </Link>
        </div>
      </div>
    </footer>
  );
}
