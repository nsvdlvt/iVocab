import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { requireVocabeerUser } from "@/lib/auth/require-user";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { TestSessionView } from "@/components/features/personal-test/TestSessionView";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireVocabeerUser();
  const test = await PersonalTestRepository.getPersonalTestById(id, user.id);

  return {
    title: test ? `${test.title} - Personal Test` : "Personal Test - Vocabee",
    description: "Luyện tập bài kiểm tra từ vựng cá nhân trên Vocabee",
  };
}

export default async function PersonalTestTakingPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireVocabeerUser();

  const test = await PersonalTestRepository.getPersonalTestById(id, user.id);
  if (!test) {
    notFound();
  }

  // Get active unfinished attempt or create new one
  let activeAttempt = await PersonalTestRepository.getActiveAttempt(id, user.id);
  if (!activeAttempt) {
    activeAttempt = await PersonalTestRepository.createAttempt(id, user.id, "practice");
  }

  if (!activeAttempt) {
    throw new Error("Không thể khởi tạo lượt làm bài kiểm tra.");
  }

  return (
    <TestSessionView
      test={test}
      initialAttempt={activeAttempt}
    />
  );
}
