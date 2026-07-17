"use client";

import React from "react";
import { motion } from "framer-motion";
import { landingStorySteps } from "./landing-data";

export function Timeline() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Cách hoạt động</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Một hành trình mạch lạc từ nhập dữ liệu đến làm chủ từ vựng</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {landingStorySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} whileHover={{ y: -4 }} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {index < landingStorySteps.length - 1 && <div className="absolute right-[-1rem] top-1/2 hidden h-px w-8 bg-gradient-to-r from-blue-300 to-transparent md:block" />}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-black text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

