import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { requireVocabeerUser } from "@/lib/auth/require-user";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { gradeVocabeeTest } from "@/lib/personal-test/vocabee-test-grader";
import { TestResult } from "@/components/features/personal-test/TestResult";

interface PageProps {
  params: Promise<{
    id: string;
    attemptId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireVocabeerUser();
  const test = await PersonalTestRepository.getPersonalTestById(id, user.id);

  return {
    title: test ? `Kết quả: ${test.title} - Vocabee` : "Kết quả kiểm tra - Vocabee",
    description: "Kết quả và giải thích bài kiểm tra từ vựng cá nhân",
  };
}

export default async function PersonalTestResultPage({ params }: PageProps) {
  const { id, attemptId } = await params;
  const user = await requireVocabeerUser();

  const data = await PersonalTestRepository.getAttemptById(attemptId, user.id);
  if (!data || data.attempt.test_id !== id) {
    notFound();
  }

  const { attempt, test } = data;
  const grading = gradeVocabeeTest(test.content, attempt.answers);

  const handleRetryAction = async () => {
    "use server";
    redirect(`/u/personal-test/${id}`);
  };

  return (
    <TestResult
      test={test}
      attempt={attempt}
      grading={grading}
      onRetry={handleRetryAction}
    />
  );
}
