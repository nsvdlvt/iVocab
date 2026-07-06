import React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { VocabularyEditor } from "@/components/features/vocabulary/VocabularyEditor";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewVocabularySetPage() {
  console.log("NEW PAGE LOADED");
  await requireUser();

  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
      <Link href="/vocabulary" className="hover:text-foreground transition-colors font-medium">
        Bộ từ vựng
      </Link>
      <span className="opacity-60">/</span>
      <span className="text-foreground font-bold">Tạo mới</span>
    </div>
  );

  return (
    <PageContainer>
      <div className="flex flex-col">
        {breadcrumb}
        <div className="mt-1">
          <VocabularyEditor />
        </div>
      </div>
    </PageContainer>
  );
}
