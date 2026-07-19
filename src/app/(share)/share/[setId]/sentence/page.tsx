import React from "react";
import { PrivateShareNotice } from "@/components/features/vocabulary/PrivateShareNotice";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { SentenceViewer } from "@/components/features/sentence/SentenceViewer";
import { ROUTES } from "@/constants/routes";
import { PageContainer } from "@/components/layout/PageContainer";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function SharedSentencePage({ params }: PageProps) {
  const { setId } = await params;
  const [set, words, stats] = await Promise.all([
    VocabSetRepository.getPublicVocabSetById(setId),
    VocabularyRepository.getPublicBySetId(setId),
    Promise.resolve({}),
  ]);

  if (!set) return <PrivateShareNotice backHref={ROUTES.VOCABULARY} />;

  const formattedWords = words.map((w) => {
    const wordStats = (stats as Record<string, { latestScore: number; highestScore: number; attemptCount: number }>)[w.id] || {
      latestScore: 0,
      highestScore: 0,
      attemptCount: 0,
    };
    return {
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      partOfSpeech: w.part_of_speech || undefined,
      ipa: w.ipa || undefined,
      isStarred: w.is_starred || false,
      latestScore: wordStats.latestScore,
      highestScore: wordStats.highestScore,
      attemptCount: wordStats.attemptCount,
    };
  });

  return (
    <PageContainer className="pt-2 md:pt-4">
      <SentenceViewer
        initialWords={formattedWords}
        setInfo={{ id: set.id, title: set.title }}
        readOnly
        onBack={async () => {
          "use server";
          const { redirect } = await import("next/navigation");
          redirect(`/share/${setId}`);
        }}
      />
    </PageContainer>
  );
}
