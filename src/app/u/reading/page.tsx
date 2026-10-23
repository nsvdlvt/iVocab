import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReadingLibraryClient } from "@/components/features/reading/ReadingLibraryClient";
import { ReadingRepository } from "@/repositories/reading.repository";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Đọc hiểu song ngữ",
  description: "Luyện đọc hiểu song ngữ Anh - Việt theo cấp độ CEFR, chạm tra từ tức thì và lưu trữ thẻ nhớ.",
};

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
          <Link href="/u/reading/new" className={cn(buttonVariants({ className: "rounded-full px-4" }))}>
            <Plus className="h-4 w-4" />
            Tạo mới
          </Link>
        ) : null}
      </div>

      {articles.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border/80 bg-card px-6 py-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <BeeMascot state="thinking" size="lg" showAura interactive />
          <div className="space-y-1.5 max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chưa có bài đọc nào</h1>
            <p className="mx-auto text-sm leading-relaxed text-muted-foreground">
              Tổ ong đang được chuẩn bị thêm nhiều bài đọc song ngữ thú vị. Hãy quay lại sớm nhé! 🐝
            </p>
          </div>
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
