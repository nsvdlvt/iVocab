"use client";

import React from "react";
import { SectionCard } from "@/components/common/SectionCard";

const faqs = [
  ["Vocabee có miễn phí không?", "Có. Người dùng có thể bắt đầu miễn phí và nâng cấp khi cần thêm trải nghiệm."],
  ["Landing page có phải dashboard không?", "Không. Landing là trang công khai để giới thiệu sản phẩm và dẫn người dùng vào app."],
  ["Dữ liệu demo có phải giả không?", "Landing dùng UI thật của Vocabee với dữ liệu demo để người xem hình dung trải nghiệm thực tế."],
];

export function FAQ() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Những câu hỏi thường gặp</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <SectionCard key={question} className="border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="text-base font-black text-slate-950">{question}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{answer}</p>
            </SectionCard>
          ))}
        </div>
      </div>
    </section>
  );
}

