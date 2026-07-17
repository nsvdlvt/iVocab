"use client";

import React from "react";
import { motion } from "framer-motion";
import { landingStats } from "./landing-data";

export function Statistics() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Số liệu</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Những con số giúp sản phẩm tạo niềm tin</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingStats.map((item) => (
            <motion.div key={item.label} whileHover={{ y: -4 }} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="text-3xl font-black text-slate-950">{item.value}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

