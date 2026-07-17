"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ROUTES } from "@/constants/routes";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo imageClassName="h-8 w-8" textClassName="scale-[0.7] origin-left" subtitleClassName="hidden" />
          <span>Nền tảng học từ vựng cao cấp cho người học hiện đại.</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href={ROUTES.LOGIN} className="hover:text-slate-950">
            Đăng nhập
          </Link>
          <Link href={ROUTES.REGISTER} className="hover:text-slate-950">
            Đăng ký
          </Link>
          <Link href={ROUTES.DASHBOARD} className="hover:text-slate-950">
            Trang chính
          </Link>
        </div>
      </div>
    </footer>
  );
}

