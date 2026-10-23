import React from "react";
import type { Metadata } from "next";
import { requireETeamUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabSetSummaryService } from "@/lib/statistics/vocab-set-summary.service";
import { ETeamVocabsClient } from "@/components/e-team/vocabs/ETeamVocabsClient";

export const metadata: Metadata = {
  title: "Học từ vựng",
  description: "Không gian học từ vựng thông minh và lộ trình thích ứng AI dành riêng cho E-Team.",
};

export const dynamic = "force-dynamic";

interface ETeamVocabsPageProps {
  searchParams: Promise<{
    search?: string;
    visibility?: string;
    sort?: string;
    page?: string;
    view?: string;
  }>;
}

const ITEMS_PER_PAGE = 12;

export default async function ETeamVocabsPage({ searchParams }: ETeamVocabsPageProps) {
  const profile = await requireETeamUser();
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.search;
  const visibility = resolvedSearchParams.visibility;
  const sort = resolvedSearchParams.sort;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  const [{ data: sets, count: totalCount }, summaries] = await Promise.all([
    VocabSetRepository.getVocabSets(profile.id, {
      search,
      visibility,
      sort,
      page,
      limit: ITEMS_PER_PAGE,
      showDeleted: false,
    }),
    VocabSetSummaryService.getUserVocabSetSummaries(profile.id),
  ]);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ETeamVocabsClient
        sets={sets}
        summaries={summaries}
        totalCount={totalCount}
        currentPage={page}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
