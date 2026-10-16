import { PageContainer } from "@/components/layout/PageContainer";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { SharedVocabularyBrowser } from "@/components/features/vocabulary/SharedVocabularyBrowser";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ProfileRepository } from "@/repositories/profile.repository";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ROUTES } from "@/constants/routes";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  try {
    const set = await VocabSetRepository.getPublicVocabSetById(setId);
    if (set?.title) {
      return {
        title: `${set.title} (Chia sẻ)`,
        description: set.description || `Bộ từ vựng chia sẻ "${set.title}" trên Vocabee`,
      };
    }
  } catch {}
  return { title: "Bộ từ chia sẻ" };
}

export default async function SharedVocabSetDetailPage({ params }: PageProps) {
  const { setId } = await params;

  if (process.env.NODE_ENV === "development") {
    console.log("[share/page] start", { setId });
  }

  const [set, words, user] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
    getCurrentUser(),
  ]);

  if (process.env.NODE_ENV === "development") {
    console.log("[share/page] fetched", {
      setId,
      hasSet: !!set,
      visibility: set?.visibility ?? null,
      wordCount: words.length,
      hasUser: !!user,
    });
  }

  if (!set) {
    if (process.env.NODE_ENV === "development") {
      console.log("[share/page] missing set -> private notice", { setId });
    }
    return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;
  }

  const author = await ProfileRepository.getPublicProfile(set.user_id);

  if (process.env.NODE_ENV === "development") {
    console.log("[share/page] author", {
      setId,
      authorFound: !!author,
      authorId: set.user_id,
    });
  }

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
