import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReadingWorkspace } from "@/components/features/reading/ReadingWorkspace";
import type { ReadingLesson } from "@/components/features/reading/reading-types";
import { ReadingRepository } from "@/repositories/reading.repository";
import { getQuestionsForArticle } from "@/lib/reading/reading-questions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await ReadingRepository.getBySlug(slug);
    if (!article) {
      return { title: "Không tìm thấy bài đọc" };
    }
    return {
      title: article.title,
      description: article.topic ? `${article.topic} - Đọc hiểu song ngữ trên Vocabee` : undefined,
    };
  } catch {
    return { title: "Đọc hiểu song ngữ" };
  }
}

function toLesson(
  article: NonNullable<Awaited<ReturnType<typeof ReadingRepository.getBySlug>>>,
  currentIndex = 1,
  totalCount = 1,
  previousSlug: string | null = null,
  nextSlug: string | null = null
): ReadingLesson {
  const totalHighlighted = article.paragraphs.reduce(
    (sum, paragraph) => sum + (paragraph.highlightedWords?.length ?? 0),
    0
  );

  const questions = getQuestionsForArticle(article.slug);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    sourceLanguage: "English",
    targetLanguage: "Vietnamese",
    paragraphs: article.paragraphs,
    topic: article.topic,
    difficulty: article.level,
    estimatedReadingMinutes: article.estimatedReadingMinutes,
    estimatedReadingTime: `${article.estimatedReadingMinutes} phút`,
    coverImageUrl: article.coverImageUrl,
    vocabularyStats: {
      newWords: article.vocabularyCount,
      knownWords: Math.max(0, article.vocabularyCount - totalHighlighted),
      totalHighlighted,
    },
    isFavorite: false,
    progress: Math.round((currentIndex / totalCount) * 100),
    lessonIndex: currentIndex,
    lessonCount: totalCount,
    questions,
    previousSlug,
    nextSlug,
  };
}

export default async function ReadingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [article, allArticles] = await Promise.all([
    ReadingRepository.getBySlug(slug),
    ReadingRepository.listPublished().catch(() => []),
  ]);

  if (!article) {
    notFound();
  }

  const articleIndex = allArticles.findIndex((a) => a.slug === slug);
  const currentIndex = articleIndex >= 0 ? articleIndex + 1 : 1;
  const totalCount = Math.max(1, allArticles.length);
  const previousSlug = articleIndex > 0 ? allArticles[articleIndex - 1]?.slug : null;
  const nextSlug =
    articleIndex >= 0 && articleIndex < allArticles.length - 1
      ? allArticles[articleIndex + 1]?.slug
      : null;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/reading"
        className="group mb-4 inline-flex items-center gap-2 px-1 py-1 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Quay lại danh sách bài đọc
      </Link>
      <ReadingWorkspace
        lesson={toLesson(article, currentIndex, totalCount, previousSlug, nextSlug)}
      />
    </main>
  );
}
