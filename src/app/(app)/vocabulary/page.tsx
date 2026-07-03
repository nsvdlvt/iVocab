import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { VocabularyClient } from "@/components/features/vocabulary/VocabularyClient";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    visibility?: string;
    sort?: string;
    page?: string;
    view?: string;
  }>;
}

const ITEMS_PER_PAGE = 12;

export default async function VocabularyPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();

  const search = resolvedSearchParams.search;
  const visibility = resolvedSearchParams.visibility;
  const sort = resolvedSearchParams.sort;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  const showDeleted = visibility === "deleted";
  const repoVisibility = showDeleted ? undefined : visibility;

  const { data: sets, count: totalCount } = await VocabSetRepository.getVocabSets(user.id, {
    search,
    visibility: repoVisibility,
    sort,
    page,
    limit: ITEMS_PER_PAGE,
    showDeleted,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Bộ từ vựng của bạn"
        description="Quản lý và ôn luyện các bộ sưu tập từ vựng tiếng Anh cá nhân của bạn."
      />
      <VocabularyClient
        sets={sets}
        totalCount={totalCount}
        currentPage={page}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </PageContainer>
  );
}
