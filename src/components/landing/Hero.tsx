"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, RotateCw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/common/SectionCard";
import { FlashcardDeck } from "@/components/features/flashcard/FlashcardDeck";
import { ROUTES } from "@/constants/routes";
import { landingDemoFlashcard, landingStats } from "./landing-data";

export function LandingHero() {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <section className="relative overflow-hidden bg-background border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-primary)_0%,transparent_34%),radial-gradient(circle_at_top_right,var(--color-chart-4)_0%,transparent_28%)] opacity-[0.07] dark:opacity-[0.14]" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-22">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-7"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="h-7 rounded-full px-3 text-xs font-semibold">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Hệ thống học từ vựng thế hệ mới
            </Badge>
            <Badge variant="secondary" className="h-7 rounded-full px-3 text-xs font-medium">
              Lặp lại ngắt quãng SRS
            </Badge>
            <Badge variant="secondary" className="h-7 rounded-full px-3 text-xs font-medium">
              Luyện ngữ cảnh AI
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Ghi nhớ sâu và làm chủ từ vựng tiếng Anh{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                không cần học vẹt.
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Vocabee kết hợp thẻ nhớ thông minh, thuật toán lặp lại ngắt quãng (SRS) và bài tập ngữ cảnh AI giúp bạn nhớ từ lâu gấp 3 lần và tự tin vận dụng vào IELTS, TOEIC hay giao tiếp thực tế.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" className="h-12 w-full rounded-xl px-7 text-base font-bold shadow-sm sm:w-auto">
                Bắt đầu học miễn phí
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl px-7 text-base font-semibold sm:w-auto"
              >
                Đăng nhập tài khoản
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Miễn phí khởi tạo bộ từ không giới hạn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Đồng bộ tiến độ trên mọi thiết bị
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {landingStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-2xs backdrop-blur-xs"
              >
                <div className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mx-auto w-full max-w-[920px] rounded-3xl border border-border/80 bg-card p-3 shadow-xl">
            <div className="rounded-2xl border border-border/80 bg-muted/35 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                    Không gian học tập trực quan
                  </div>
                  <div className="mt-1 text-lg font-bold text-foreground sm:text-xl">
                    Thẻ từ tương tác & Nhịp ôn tập SRS
                  </div>
                </div>
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full bg-card px-3 text-xs font-semibold">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Bản xem trước tương tác
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
                <SectionCard className="overflow-hidden border-border/80 bg-card p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                        Flashcard thông minh
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Nhấn vào thẻ hoặc nút bên phải để lật xem nghĩa & ví dụ
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setFlipped((v) => !v)}
                      className="rounded-lg font-semibold"
                    >
                      <RotateCw className="mr-1 h-3 w-3" />
                      Lật thẻ
                    </Button>
                  </div>
                  <div className="mt-3 scale-[0.94] origin-top">
                    <FlashcardDeck
                      word={landingDemoFlashcard}
                      flipped={flipped}
                      frontMode="term"
                      autoSpeak={false}
                      isStarred={false}
                      readOnly
                      onFlip={() => setFlipped((v) => !v)}
                      onSpeak={() => {}}
                      onOpenSettings={() => {}}
                      onToggleAutoSpeak={() => {}}
                      onToggleStar={() => {}}
                    />
                  </div>
                </SectionCard>

                <div className="flex flex-col justify-between gap-3">
                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                        Phân tích từ vựng
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        adjective
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-black text-foreground">peculiar</span>
                      <span className="font-mono text-xs text-muted-foreground">/pɪˈkjuːliə(r)/</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground/90">
                      kỳ lạ, mang nét riêng biệt
                    </p>
                    <p className="mt-1.5 text-xs italic text-muted-foreground">
                      &ldquo;The region has its own peculiar charm.&rdquo;
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                        Chu kỳ nhớ SRS
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Độ bền: 94%
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: "Hôm nay", pct: 45, count: "22 từ" },
                        { label: "Ngày mai", pct: 72, count: "18 từ" },
                        { label: "Tuần tới", pct: 90, count: "12 từ" },
                      ].map((bar, i) => (
                        <div key={bar.label} className="space-y-1.5">
                          <div className="flex h-16 items-end rounded-xl bg-muted/60 p-1.5">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${bar.pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.12 }}
                              className="w-full rounded-lg bg-gradient-to-t from-primary to-emerald-500"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                            <span>{bar.label}</span>
                            <span className="font-bold text-foreground">{bar.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                          Mục tiêu hôm nay
                        </div>
                        <div className="mt-1 text-2xl font-black text-foreground">
                          30 <span className="text-sm font-medium text-muted-foreground">/ 30 từ hoàn thành</span>
                        </div>
                      </div>
                      <Badge variant="success" className="h-6 px-2.5 text-xs font-bold">
                        Chuỗi 14 ngày 🔥
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
