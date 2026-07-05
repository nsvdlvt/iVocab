"use client";

import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ROUTES } from "@/constants/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Column: Brand Intro (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-950 via-slate-900 to-violet-950 text-white relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2 select-none w-fit">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            VOCABEE
          </span>
        </Link>

        {/* Center welcome information */}
        <div className="space-y-4 max-w-lg my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            Nâng tầm vốn từ vựng tiếng Anh của bạn mỗi ngày
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Học tập khoa học với phương pháp lặp lại ngắt quãng, rèn luyện qua các bài quiz tương tác và nhận sự trợ giúp trực tiếp từ trợ lý AI thông minh.
          </p>
        </div>

        {/* Bottom footer */}
        <div className="text-xs text-slate-400">
          © 2026 Vocabee. Thiết kế và phát triển theo chuẩn kiến trúc chuyên nghiệp.
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-6">
            <Link href={ROUTES.HOME} className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                VOCABEE
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
