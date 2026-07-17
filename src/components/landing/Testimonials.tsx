"use client";

import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  { name: "Lan", role: "Người học IELTS", comment: "Giao diện nhìn vào là hiểu ngay, và cảm giác học rất có động lực." },
  { name: "Minh", role: "Tự học mỗi ngày", comment: "Mọi thứ có nhịp hơn hẳn, không còn cảm giác ứng dụng bị rời rạc." },
  { name: "An", role: "Học sinh cấp 3", comment: "Flashcard và SRS làm mình muốn quay lại mỗi ngày." },
];

export function Testimonials() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Đánh giá</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Người học cảm nhận sự khác biệt ngay từ cái nhìn đầu tiên</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <motion.div key={item.name} whileHover={{ y: -4 }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{item.name.slice(0, 1)}</div>
                <div>
                  <div className="font-black text-slate-950">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                </div>
              </div>
              <div className="mt-4 flex text-amber-500">★★★★★</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.comment}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

