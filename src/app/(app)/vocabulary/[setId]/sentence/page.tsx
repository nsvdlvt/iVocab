import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { SentenceViewer } from "@/components/features/sentence/SentenceViewer";

import { SentenceHistoryRepository } from "@/repositories/sentence-history.repository";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export default async function SentencePracticePage({ params }: PageProps) {
  console.time("TOTAL PAGE");
  try {
    const { setId } = await params;
    const user = await requireUser();

    const [vocabSet, words, stats] = await Promise.all([
      VocabSetRepository.getVocabSetById(setId, user.id),
      VocabularyRepository.getBySetId(setId, user.id),
      SentenceHistoryRepository.getStatsForSet(user.id, setId),
    ]);
    
    if (!vocabSet) {
      notFound();
    }

    const formattedWords = words.map((w) => {
      const wordStats = stats[w.id] || { latestScore: 0, highestScore: 0, attemptCount: 0 };
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
          setInfo={{ id: vocabSet.id, title: vocabSet.title }}
          onBack={async () => {
            "use server";
            const { redirect } = await import("next/navigation");
            redirect(`/vocabulary/${setId}`);
          }}
        />
      </PageContainer>
    );
  } finally {
    console.timeEnd("TOTAL PAGE");
  }
}
