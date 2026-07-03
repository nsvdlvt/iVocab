import React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { NewVocabSetForm } from "@/components/features/vocabulary/NewVocabSetForm";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewVocabularySetPage() {
  await requireUser();

  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link href="/vocabulary" className="hover:text-foreground transition-colors font-medium">
        Bộ từ vựng
      </Link>
      <span className="opacity-60">/</span>
      <span className="text-foreground font-semibold">Tạo mới</span>
    </div>
  );

  return (
    <PageContainer>
      <div className="flex flex-col">
        {breadcrumb}
        <PageHeader
          title="Tạo bộ từ vựng mới"
          description="Khởi tạo một bộ học từ vựng mới để lưu trữ, theo dõi và ôn tập thông minh."
        />
        <div className="mt-2">
          <NewVocabSetForm />
        </div>
      </div>
    </PageContainer>
  );
}
