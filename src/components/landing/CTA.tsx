"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";

export function CTA() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 text-center shadow-lg sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-primary)_0%,transparent_40%),radial-gradient(circle_at_bottom_right,var(--color-chart-2)_0%,transparent_40%)] opacity-[0.08] dark:opacity-[0.16]" />

          <div className="relative z-10 mx-auto max-w-3xl space-y-5">
            <Badge variant="default" className="mx-auto h-7 rounded-full px-3.5 text-xs font-semibold">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Sẵn sàng bứt phá vốn từ vựng?
            </Badge>

            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Biến mỗi 15 phút mỗi ngày thành vốn từ vựng theo bạn suốt đời.
            </h2>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Khởi tạo thư viện từ vựng cá nhân, nhận lịch ôn tập ngắt quãng thông minh (SRS) và luyện tập ngữ cảnh thực tế cùng trợ lý AI ngay hôm nay.
            </p>

            <div className="pt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={ROUTES.REGISTER} className="w-full sm:w-auto">
                <Button size="lg" className="h-12 w-full rounded-xl px-8 text-base font-bold shadow-sm sm:w-auto">
                  Tạo tài khoản miễn phí
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={ROUTES.LOGIN} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl px-8 text-base font-semibold sm:w-auto"
                >
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
