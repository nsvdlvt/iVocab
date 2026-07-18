import { CommunityVocabularyPage } from "@/components/admin/community-vocabulary/community-vocabulary-page";
import { requirePermission } from "@/lib/auth/admin";
import { CommunityVocabularyRepository } from "@/repositories/admin/community-vocabulary.repository";

export const dynamic = "force-dynamic";

export default async function CommunityVocabularyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePermission("manageVocabulary");

  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);
  const pageSize = 10;
  const search = String(params.search ?? "");
  const sort = String(params.sort ?? "created_at");
  const order = String(params.order ?? "desc") === "asc" ? "asc" : "desc";

  const [categoriesResult, setsResult, publishableSetsResult] = await Promise.allSettled([
    CommunityVocabularyRepository.getCategories(),
    CommunityVocabularyRepository.getCommunitySets(page, pageSize, search, sort, order),
    CommunityVocabularyRepository.getPublishableVocabularySets(),
  ]);

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const communitySets =
    setsResult.status === "fulfilled"
      ? setsResult.value
      : { data: [], count: 0, page, pageSize };
  const publishableSets = publishableSetsResult.status === "fulfilled" ? publishableSetsResult.value : [];
  const hasDataLayerError =
    categoriesResult.status === "rejected" || setsResult.status === "rejected" || publishableSetsResult.status === "rejected";

  return (
    <CommunityVocabularyPage
      categories={categories}
      sets={communitySets.data}
      publishableSets={publishableSets}
      page={page}
      pageSize={pageSize}
      total={communitySets.count}
      search={search}
      sort={sort}
      order={order}
      hasDataLayerError={hasDataLayerError}
    />
  );
}
