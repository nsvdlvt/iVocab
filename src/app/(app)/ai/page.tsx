import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { ChatInterface } from "@/components/features/ai/ChatInterface";

export default function AIPage() {
  return (
    <PageContainer className="max-w-4xl space-y-6 md:space-y-8">
      <PageHeader
        title="Trợ lý học tập AI"
        description="Hỏi trợ lý ảo về ngữ nghĩa, phát âm, đặt câu ví dụ hoặc phân biệt các cấu trúc từ vựng."
      />
      <div className="max-w-3xl mx-auto">
        <ChatInterface />
      </div>
    </PageContainer>
  );
}
