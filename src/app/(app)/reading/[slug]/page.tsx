import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReadingWorkspace } from "@/components/features/reading/ReadingWorkspace";
import type { ReadingLesson } from "@/components/features/reading/reading-types";
import { ReadingRepository } from "@/repositories/reading.repository";

export const dynamic = "force-dynamic";

function toLesson(article: NonNullable<Awaited<ReturnType<typeof ReadingRepository.getBySlug>>>): ReadingLesson {
  const totalHighlighted = article.paragraphs.reduce((sum, paragraph) => sum + (paragraph.highlightedWords?.length ?? 0), 0);

  return {
    id: article.id,
    title: article.title,
    sourceLanguage: "English",
    targetLanguage: "Vietnamese",
    paragraphs: article.paragraphs,
    topic: article.topic,
    difficulty: article.level,
    estimatedReadingTime: `${article.estimatedReadingMinutes} phút`,
    coverImageUrl: article.coverImageUrl,
    vocabularyStats: {
      newWords: article.vocabularyCount,
      knownWords: Math.max(0, article.vocabularyCount - totalHighlighted),
      totalHighlighted,
    },
    isFavorite: false,
    progress: 0,
    lessonIndex: 1,
    lessonCount: 1,
  };
}

export default async function ReadingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await ReadingRepository.getBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/reading"
        className="group mb-4 inline-flex items-center gap-2 px-1 py-1 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Quay lại danh sách bài đọc
      </Link>
      <ReadingWorkspace lesson={toLesson(article)} />
    </main>
  );
}
