import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { PageContainer } from "@/components/layout/PageContainer";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { VocabularyEditor } from "@/components/features/vocabulary/VocabularyEditor";

interface EditVocabularyPageProps {
  params: Promise<{
    setId: string;
  }>;
}

export default async function EditVocabularyPage({ params }: EditVocabularyPageProps) {
  const { setId } = await params;
  const profile = await requireUser();
  const userId = profile.id;

  const [vocabSet, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, userId),
    VocabularyRepository.getBySetId(setId, userId),
  ]);

  if (!vocabSet) {
    return notFound();
  }

  // 3. Map database schema to internal editor types
  const initialItems = words.map((item) => ({
    id: item.id,
    word: item.word,
    meaning: item.meaning,
    ipa: item.ipa || "",
    partOfSpeech: item.part_of_speech || "",
    example: item.example || "",
    synonyms: item.synonyms ? item.synonyms.join(",") : "",
    antonyms: item.antonyms ? item.antonyms.join(",") : "",
    note: item.note || "",
    example_translation: item.example_translation || "",
  }));

  return (
    <PageContainer>
      <VocabularyEditor
        initialSetId={vocabSet.id}
        initialTitle={vocabSet.title}
        initialDescription={vocabSet.description || ""}
        initialVisibility={vocabSet.visibility as "public" | "private"}
        initialItems={initialItems}
      />
    </PageContainer>
  );
}
