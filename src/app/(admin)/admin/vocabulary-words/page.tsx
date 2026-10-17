import type { Metadata } from "next";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { WordsTableClient } from "@/components/admin/vocabulary/words-table-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Kho Từ vựng Toàn cục | Vocabee Admin",
  description: "Duyệt, tra cứu, chỉnh sửa và quản lý toàn bộ các từ vựng tiếng Anh trong hệ thống.",
};

interface AdminVocabularyWordsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminVocabularyWordsPage({ searchParams }: AdminVocabularyWordsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = (params?.search as string) || "";
  const pos = (params?.pos as string) || "all";
  const diff = (params?.diff as string) || "all";

  const { data: words, count, totalPages } = await AdminVocabularyRepository.getWords(
    page,
    15,
    search,
    undefined,
    pos,
    diff
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Kho Từ vựng Toàn cục
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tất cả các từ vựng, phiên âm IPA, nghĩa tiếng Việt và câu ví dụ minh họa.
          </p>
        </div>
      </div>

      <WordsTableClient
        words={words}
        totalCount={count}
        currentPage={page}
        pageSize={15}
        totalPages={totalPages}
        search={search}
        partOfSpeechFilter={pos}
        difficultyFilter={diff}
      />
    </div>
  );
}
