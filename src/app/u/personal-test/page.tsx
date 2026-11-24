import React from "react";
import { Metadata } from "next";
import { requireVocabeerUser } from "@/lib/auth/require-user";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { PersonalTestDashboard } from "@/components/features/personal-test/PersonalTestDashboard";

export const metadata: Metadata = {
  title: "Personal Test - Vocabee",
  description: "Tạo, nhập và thực hành các bài kiểm tra từ vựng cá nhân hóa theo chuẩn vocabee-test-v1",
};

export default async function PersonalTestPage() {
  const user = await requireVocabeerUser();

  const [tests, recentAttempts] = await Promise.all([
    PersonalTestRepository.getPersonalTests(user.id),
    PersonalTestRepository.getRecentAttempts(user.id, 5),
  ]);

  return <PersonalTestDashboard tests={tests} recentAttempts={recentAttempts} />;
}
