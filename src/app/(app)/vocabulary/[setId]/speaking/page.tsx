import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { PageContainer } from "@/components/layout/PageContainer";
import { SpeakingViewer, SpeakingWord } from "@/components/features/speaking/SpeakingViewer";
import type { Metadata } from "next";
import { getVocabSetMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const title = await getVocabSetMetadataTitle(setId, "Luyện nói & Phát âm");
  return { title };
}

export default async function SpeakingPracticePage({ params }: PageProps) {
  const { setId } = await params;
  const user = await requireUser();

  const [vocabSet, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, user.id),
    VocabularyRepository.getBySetId(setId, user.id),
  ]);

  if (!vocabSet) {
    notFound();
  }

  const formattedWords: SpeakingWord[] = words.map((w) => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    ipa: w.ipa || undefined,
    partOfSpeech: w.part_of_speech || undefined,
    example: w.example || undefined,
    exampleTranslation: w.example_translation || undefined,
    isStarred: w.is_starred || false,
  }));

  return (
    <PageContainer className="pt-2 md:pt-4">
      <SpeakingViewer
        words={formattedWords}
        setInfo={{ id: vocabSet.id, title: vocabSet.title }}
      />
    </PageContainer>
  );
}
