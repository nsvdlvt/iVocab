"use client";

import React from "react";
import { FeatureCard } from "./FeatureCard";
import { landingFeatureCards } from "./landing-data";

export function FeatureGrid() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Tính năng</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Mỗi tính năng đều có hình ảnh thật và tương tác nhỏ</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Không chỉ có chữ mô tả. Mỗi khối đều dùng một mảnh UI thật của Vocabee để người xem hiểu ngay ứng dụng làm gì.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {landingFeatureCards.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.description} accent="from-blue-50 to-white">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="h-2 w-20 rounded-full bg-blue-600/80" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-xl bg-white" />
                  <div className="h-12 rounded-xl bg-white" />
                  <div className="h-12 rounded-xl bg-white" />
                </div>
              </div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
