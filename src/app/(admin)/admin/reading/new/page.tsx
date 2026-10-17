import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { ArticleEditorClient } from "@/components/admin/reading/article-editor-client";

export const metadata: Metadata = {
  title: "Tạo Bài đọc Song ngữ Mới | Vocabee Admin",
  description: "Tạo bài đọc song ngữ tiếng Anh - tiếng Việt mới với các đoạn văn và từ vựng trọng tâm.",
};

export default async function AdminNewReadingArticlePage() {
  await requireAdmin();

  return <ArticleEditorClient />;
}
