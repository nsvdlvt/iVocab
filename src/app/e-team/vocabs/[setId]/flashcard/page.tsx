import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireETeamUser } from "@/lib/auth/require-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { FlashcardStudy } from "@/components/features/flashcard/FlashcardStudy";
import { ROUTES } from "@/constants/routes";

interface PageProps {
  params: Promise<{ setId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  try {
    const profile = await requireETeamUser();
    const set = await VocabSetRepository.getVocabSetById(setId, profile.id);
    if (set?.title) {
      return {
        title: `Flashcard: ${set.title} | E-Team Vocabee`,
        description: `Ôn tập Flashcard bộ từ ${set.title}`,
      };
    }
  } catch {}
  return {
    title: "Flashcard | E-Team",
  };
}

export default async function ETeamFlashcardPage({ params }: PageProps) {
  const { setId } = await params;
  const profile = await requireETeamUser();

  const [set, words] = await Promise.all([
    VocabSetRepository.getVocabSetById(setId, profile.id),
    ReviewRepository.getBySetId(profile.id, setId),
  ]);

  if (!set || set.deleted_at) {
    notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-4rem)] overflow-x-hidden">
      <FlashcardStudy
        initialWords={words}
        setInfo={{ id: set.id, title: set.title }}
        onBackHref={ROUTES.ETEAM_VOCAB_DETAIL(setId)}
      />
    </div>
  );
}
