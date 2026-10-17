import type { Metadata } from "next";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { SetsTableClient } from "@/components/admin/vocabulary/sets-table-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Quản lý Bộ từ vựng | Vocabee Admin",
  description: "Duyệt, tìm kiếm và quản lý toàn bộ các bộ từ vựng người dùng và cộng đồng.",
};

interface AdminVocabularySetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminVocabularySetsPage({ searchParams }: AdminVocabularySetsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = (params?.search as string) || "";
  const visibility = (params?.visibility as string) || "all";

  const { data: sets, count, totalPages } = await AdminVocabularyRepository.getSets(
    page,
    15,
    search,
    visibility
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý Bộ từ vựng
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả bộ từ vựng được tạo bởi người dùng và hệ thống.
          </p>
        </div>
      </div>

      <SetsTableClient
        sets={sets}
        totalCount={count}
        currentPage={page}
        pageSize={15}
        totalPages={totalPages}
        search={search}
        visibilityFilter={visibility}
      />
    </div>
  );
}
