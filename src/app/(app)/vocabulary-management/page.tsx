import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { VocabularyLibraryClient } from "@/components/features/vocabulary/VocabularyLibraryClient";
import { requireUser } from "@/lib/auth/require-user";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { VocabularyStatsService } from "@/lib/statistics/vocabulary-stats.service";

export const dynamic = "force-dynamic";

export default async function VocabularyManagementPage() {
  const user = await requireUser();
  const words = await VocabularyRepository.getLibraryByUser(user.id);
  const stats = await VocabularyStatsService.getUserVocabularyStats(user.id);

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="Từ vựng của bạn" description="Quản lý toàn bộ từ vựng bạn đã học ở một nơi." />
      <VocabularyLibraryClient words={words} stats={stats} />
    </PageContainer>
  );
}
