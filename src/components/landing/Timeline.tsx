"use client";

import React from "react";
import { motion } from "framer-motion";
import { landingStorySteps } from "./landing-data";

export function Timeline() {
  return (
    <section id="workflow" className="border-y border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Quy trình học khoa học
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Lộ trình 5 bước từ thu thập từ mới đến ghi nhớ vĩnh viễn
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Thay vì học rời rạc rồi nhanh chóng quên lãng, Vocabee dẫn dắt bạn qua chu trình khép kín giúp não bộ chuyển từ vựng từ trí nhớ ngắn hạn sang phản xạ dài hạn.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {landingStorySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                whileHover={{ y: -4 }}
                className="relative flex flex-col rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
              >
                {index < landingStorySteps.length - 1 && (
                  <div className="pointer-events-none absolute right-[-1rem] top-1/2 hidden h-px w-8 bg-gradient-to-r from-primary/40 to-transparent md:block" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
