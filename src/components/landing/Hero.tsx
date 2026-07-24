"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { FlashcardDeck } from "@/components/features/flashcard/FlashcardDeck";
import { ROUTES } from "@/constants/routes";
import { landingDemoFlashcard } from "./landing-data";

export function LandingHero() {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,158,27,0.08),transparent_26%)]" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative z-10 space-y-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">Sản phẩm thật</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">Học thích ứng</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">Luyện bằng AI</span>
          </div>
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">Vocabee</p>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Một nơi duy nhất để nhập, học và chinh phục từ vựng.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Vocabee giúp bạn biến bộ từ thô thành hệ thống học tập có nhịp, có lịch và có động lực.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" className="h-13 rounded-full bg-blue-600 px-7 text-base font-black text-white hover:bg-blue-500">
                Trải nghiệm ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button size="lg" variant="outline" className="h-13 rounded-full border-slate-300 bg-white px-7 text-base font-bold text-slate-800 hover:bg-slate-50">
                Đăng nhập
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["20,000+", "Từ đã học"],
              ["98%", "Ghi nhớ"],
              ["1M+", "Lượt ôn"],
              ["4.9★", "Đánh giá"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-black text-slate-950 sm:text-3xl">{value}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7 }} className="relative z-10">
          <div className="mx-auto w-full max-w-[920px] rounded-[2.25rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Không gian Vocabee</div>
                  <div className="mt-2 text-2xl font-black text-white sm:text-3xl">Flashcard là trung tâm</div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200">
                  <Zap className="h-4 w-4 text-amber-300" />
                  Demo sống
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <SectionCard className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Flashcard</div>
                        <p className="mt-1 text-sm text-slate-600">Bấm hoặc nhấn Enter để lật thẻ.</p>
                      </div>
                      <button onClick={() => setFlipped((v) => !v)} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50">
                        Lật thẻ
                      </button>
                    </div>
                    <div className="mt-4 scale-[0.92] origin-top">
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
                  </div>
                </SectionCard>

                <div className="space-y-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">Từ điển</div>
                    <div className="mt-2 text-lg font-black text-slate-950">peculiar</div>
                    <div className="mt-1 text-sm text-slate-600">/pɪˈkjuːliə(r)/ • kỳ lạ</div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">SRS</div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[24, 35, 18].map((h, i) => (
                        <div key={i} className="flex h-24 items-end rounded-2xl bg-slate-100 p-1">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.9, delay: i * 0.12 }} className="w-full rounded-xl bg-gradient-to-t from-emerald-500 to-sky-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-700">Daily Goal</div>
                    <div className="mt-2 text-3xl font-black text-slate-950">30</div>
                    <div className="text-sm text-slate-600">hoạt động hôm nay</div>
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
