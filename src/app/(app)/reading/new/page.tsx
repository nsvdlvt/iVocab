import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ReadingCreateForm } from "@/components/features/reading/ReadingCreateForm";
import { requireReadingAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewReadingPage() {
  const { user } = await requireReadingAdmin();

  if (user.email !== "dungbnlvt@gmail.com") {
    notFound();
  }

  return (
    <PageContainer className="max-w-[1500px]">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tạo bài đọc mới</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Chỉ admin được phép tạo và xuất bản Reading. Nhập nội dung theo từng đoạn để hệ thống ghép song song English / Vietnamese.
        </p>
      </div>

      <ReadingCreateForm />
    </PageContainer>
  );
}
