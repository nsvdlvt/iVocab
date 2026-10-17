import type { Metadata } from "next";
import { AdminReadingRepository } from "@/repositories/admin/reading.repository";
import { ReadingTableClient } from "@/components/admin/reading/reading-table-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Quản lý Đọc Song ngữ | Vocabee Admin",
  description: "Quản lý các bài đọc song ngữ Anh - Việt, dịch đoạn và câu hỏi đọc hiểu.",
};

interface AdminReadingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReadingPage({ searchParams }: AdminReadingPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = (params?.search as string) || "";
  const status = (params?.status as "draft" | "published" | "all") || "all";

  const { data: articles, count, totalPages } = await AdminReadingRepository.getArticles(
    page,
    15,
    search,
    status
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý Bài đọc Song ngữ
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả bài đọc tiếng Anh kèm bản dịch tiếng Việt theo từng đoạn và kiểm tra đọc hiểu.
          </p>
        </div>
      </div>

      <ReadingTableClient
        articles={articles}
        totalCount={count}
        currentPage={page}
        pageSize={15}
        totalPages={totalPages}
        search={search}
        statusFilter={status}
      />
    </div>
  );
}
