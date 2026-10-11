"use client";

import React from "react";
import { GraduationCap, BookCheck, Award, Globe2, Sparkles } from "lucide-react";

const items = [
  { icon: GraduationCap, label: "Luyện thi IELTS 6.5 - 8.0+" },
  { icon: Award, label: "Chinh phục TOEIC 4 Kỹ năng" },
  { icon: Globe2, label: "Tiếng Anh Học thuật & Giao tiếp" },
  { icon: BookCheck, label: "Sinh viên & Người đi làm tự học" },
  { icon: Sparkles, label: "Xây dựng vốn từ chuyên ngành" },
];

export function TrustedBy() {
  return (
    <section className="border-b border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          Thiết kế tối ưu cho mục tiêu học tập thực tế
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {items.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-foreground shadow-2xs"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
