import { PageContainer } from "@/components/layout/PageContainer";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { SharedVocabularyBrowser } from "@/components/features/vocabulary/SharedVocabularyBrowser";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ProfileRepository } from "@/repositories/profile.repository";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function SharedVocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words, user] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
    getCurrentUser(),
  ]);

  if (!set) {
    return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;
  }

  const author = await ProfileRepository.getPublicProfile(set.user_id);

  return (
    <PageContainer className="py-6 sm:py-8">
      <SharedVocabularyBrowser
        setId={setId}
        isAuthenticated={!!user}
        words={words}
        title={set.title}
        description={set.description}
        authorName={author?.display_name ?? "Học viên"}
        authorAvatarUrl={author?.avatar_url}
        createdAt={set.created_at}
      />
    </PageContainer>
  );
}
