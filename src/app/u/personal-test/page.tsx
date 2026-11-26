import React from "react";
import { Metadata } from "next";
import { requireVocabeerUser } from "@/lib/auth/require-user";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { PersonalTestDashboard } from "@/components/features/personal-test/PersonalTestDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personal Test - Vocabee",
  description:
    "Chọn bộ từ vựng, tùy chỉnh danh sách từ và tạo bài kiểm tra cá nhân hóa 4 kỹ năng bằng AI trên Vocabee",
};

export default async function PersonalTestPage() {
  const user = await requireVocabeerUser();

  const [selectableSets, tests, recentAttempts] = await Promise.all([
    PersonalTestRepository.getUserSelectableVocabSets(user.id),
    PersonalTestRepository.getPersonalTests(user.id),
    PersonalTestRepository.getRecentAttempts(user.id, 5),
  ]);

  return (
    <PersonalTestDashboard
      selectableSets={selectableSets}
      tests={tests}
      recentAttempts={recentAttempts}
    />
  );
}
