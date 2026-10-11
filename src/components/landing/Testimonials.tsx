"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Khánh Lan",
    role: "Học viên IELTS 7.5",
    comment:
      "Nhờ lịch ôn SRS và bài tập điền từ theo ngữ cảnh AI, mình không còn quên từ học thuật sau vài ngày như lúc chép giấy nữa. Điểm Reading tăng từ 6.5 lên 8.0 sau 2 tháng.",
  },
  {
    name: "Hoàng Minh",
    role: "Kỹ sư phần mềm",
    comment:
      "Mình dùng tính năng nhập từ nhanh từ các tài liệu chuyên ngành và đọc song ngữ mỗi tối 15 phút. Giao diện tối ưu, có chế độ tối rất dịu mắt khi học ban đêm.",
  },
  {
    name: "Phương An",
    role: "Sinh viên Đại học Ngoại thương",
    comment:
      "Thẻ flashcard có sẵn phiên âm IPA, từ đồng nghĩa và ví dụ sát thực tế. Mỗi ngày vào nhìn biểu đồ dự báo ôn tập và giữ chuỗi Streak thực sự rất cuốn.",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Chia sẻ từ người học
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Được đồng hành cùng hàng nghìn người học nghiêm túc mỗi ngày
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Từ học sinh luyện thi chứng chỉ quốc tế đến người đi làm bận rộn, Vocabee giúp việc duy trì kỷ luật học từ vựng trở nên nhẹ nhàng và hiệu quả.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -4 }}
              className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-xs"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
