"use client";

import React from "react";
import { motion } from "framer-motion";
import { landingStats } from "./landing-data";

export function Statistics() {
  return (
    <section className="bg-background border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Hiệu quả được chứng minh
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Kết quả thực tế từ phương pháp lặp lại ngắt quãng & thực hành chủ động
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Mỗi phiên học ngắn từ 10–15 phút mỗi ngày tạo nên sự khác biệt vượt trội về khối lượng từ vựng và khả năng phản xạ ngôn ngữ.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingStats.map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
            >
              <div className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                {item.value}
              </div>
              <div className="mt-2 text-sm font-bold text-foreground">
                {item.label}
              </div>
              {item.detail && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
