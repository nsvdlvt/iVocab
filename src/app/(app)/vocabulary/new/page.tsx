import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { VocabularyEditor } from "@/components/features/vocabulary/VocabularyEditor";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Tạo bộ từ vựng",
  description: "Tạo mới bộ từ vựng tiếng Anh theo chủ đề hoặc trích xuất từ văn bản.",
};

export const dynamic = "force-dynamic";

export default async function NewVocabularySetPage() {
  await requireUser();

  return (
    <PageContainer>
      <div className="flex flex-col">
        <VocabularyEditor />
      </div>
    </PageContainer>
  );
}
