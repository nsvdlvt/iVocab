"use client";

import React from "react";

const items = ["Nhà học cá nhân", "Lớp ôn tập", "Người học IELTS", "Người học TOEIC", "Tự học mỗi ngày"];

export function TrustedBy() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <p className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Được tin dùng bởi</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {items.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

