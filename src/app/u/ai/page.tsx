import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { AIStudioHub } from "@/components/features/ai/AIStudioHub";

export const metadata: Metadata = {
  title: "Vocabee AI Studio",
  description:
    "Phòng luyện AI thông minh: Dệt truyện ngẫu hồi từ vựng, thử thách nhập vai đàm thoại thực tế và giải đáp cùng gia sư ảo.",
};

export default function AIPage() {
  return (
    <PageContainer className="max-w-5xl space-y-6 md:space-y-8 pb-16">
      <PageHeader
        title="Vocabee AI Studio"
        description="Không gian học từ vựng ngữ cảnh thế hệ mới: Dệt câu chuyện sinh động, thử thách nhập vai hội thoại thực chiến."
      />
      <AIStudioHub />
    </PageContainer>
  );
}
