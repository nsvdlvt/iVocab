import React, { Suspense } from "react";
import type { Metadata } from "next";
import { DictionaryPageClient } from "@/components/features/dictionary/DictionaryPageClient";
import DictionaryLoading from "./loading";

export const metadata: Metadata = {
  title: "Từ điển Anh - Việt | Vocabee",
  description: "Tra cứu từ điển tiếng Anh hiện đại, phát âm chuẩn UK/US, phân tích từ đa nghĩa và lưu từ vựng vào bộ từ cá nhân.",
};

export default function DictionaryPage() {
  return (
    <Suspense fallback={<DictionaryLoading />}>
      <DictionaryPageClient />
    </Suspense>
  );
}
