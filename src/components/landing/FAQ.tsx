"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";

const faqs = [
  {
    question: "Phương pháp lặp lại ngắt quãng (SRS) trên Vocabee hoạt động thế nào?",
    answer:
      "Mỗi khi bạn ôn một thẻ từ và chọn mức độ nhớ (Quên, Khó, Tốt, Dễ), thuật toán SRS sẽ tự động tính toán khoảng cách ngày tối ưu cho lần ôn tiếp theo—giúp bạn ôn đúng lúc sắp quên thay vì học lại toàn bộ danh sách.",
  },
  {
    question: "Tôi có thể tự nhập danh sách từ vựng cá nhân từ Excel hoặc Quizlet không?",
    answer:
      "Hoàn toàn được. Bạn có thể nhập nhanh hàng trăm từ qua file CSV, dán văn bản thô hoặc thêm từng từ. Hệ thống hỗ trợ chuẩn hóa phiên âm IPA, từ loại, nghĩa tiếng Việt và câu ví dụ minh họa.",
  },
  {
    question: "Tính năng AI hỗ trợ việc học từ vựng như thế nào?",
    answer:
      "Thay vì chỉ lật thẻ học thuộc lòng, AI của Vocabee tạo các bài tập trắc nghiệm thích ứng, câu hỏi điền từ vào ngữ cảnh (Cloze test) và bài đọc song ngữ theo trình độ CEFR để bạn hiểu sâu sắc thái sử dụng của từ.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-background border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Câu hỏi thường gặp
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Giải đáp nhanh trước khi bạn bắt đầu hành trình
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tìm hiểu cách Vocabee giúp bạn xây dựng hệ thống từ vựng bền vững và tiết kiệm tối đa thời gian ôn luyện.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {faqs.map(({ question, answer }) => (
            <SectionCard
              key={question}
              className="flex flex-col gap-3 rounded-3xl border-border/80 bg-card p-6 shadow-xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HelpCircle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold leading-snug text-foreground">{question}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
            </SectionCard>
          ))}
        </div>
      </div>
    </section>
  );
}
