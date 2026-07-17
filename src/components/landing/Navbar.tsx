"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        <BrandLogo imageClassName="h-10 w-10" textClassName="scale-[0.8] origin-left" subtitleClassName="hidden" />
        <div className="hidden items-center gap-2 md:flex">
          <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" className="rounded-full px-5 text-slate-700 hover:bg-slate-100 hover:text-slate-950">
              Đăng nhập
            </Button>
          </Link>
          <Link href={ROUTES.REGISTER}>
            <Button className="rounded-full bg-blue-600 px-5 font-black text-white hover:bg-blue-500">
              Bắt đầu miễn phí
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

