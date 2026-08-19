import { createClient } from "@/lib/supabase/server";
import { ReadingLibraryClient } from "@/components/features/reading/ReadingLibraryClient";
import { ReadingRepository } from "@/repositories/reading.repository";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
  const articles = await ReadingRepository.listPublished().catch(() => []);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const canCreate = userData.user?.email === "dungbnlvt@gmail.com";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4 flex justify-end">
        {canCreate ? (
          <Link href="/reading/new" className={cn(buttonVariants({ className: "rounded-full px-4" }))}>
            <Plus className="h-4 w-4" />
            Tạo mới
          </Link>
        ) : null}
      </div>

      {articles.length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chưa có bài đọc nào</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Khi admin publish bài Reading đầu tiên, thư viện sẽ tự động hiển thị ở đây.
          </p>
        </section>
      ) : (
        <ReadingLibraryClient
          articles={articles.map((article) => ({
            slug: article.slug,
            title: article.title,
            description: article.description,
            coverImageUrl: article.coverImageUrl ?? null,
            topic: article.topic,
            level: article.level,
            estimatedReadingMinutes: article.estimatedReadingMinutes,
            vocabularyCount: article.vocabularyCount,
          }))}
        />
      )}
    </main>
  );
}
