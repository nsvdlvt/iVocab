import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminReadingRepository } from "@/repositories/admin/reading.repository";
import { ArticleEditorClient } from "@/components/admin/reading/article-editor-client";

interface ReadingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReadingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const article = await AdminReadingRepository.getArticleById(id);
    if (article?.title) {
      return { title: `Chỉnh sửa: ${article.title} | Vocabee Admin` };
    }
  } catch {}
  return { title: "Chỉnh sửa bài đọc | Vocabee Admin" };
}

export default async function AdminReadingDetailPage({ params }: ReadingDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const article = await AdminReadingRepository.getArticleById(id);
  if (!article) {
    notFound();
  }

  return <ArticleEditorClient initialArticle={article} />;
}
