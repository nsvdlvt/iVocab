"use server";

import { requireVocabeerUser } from "@/lib/auth/require-user";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { validateVocabeeTestJson } from "@/lib/personal-test/vocabee-test-validator";
import { revalidatePath } from "next/cache";
import { TestMode } from "@/types/vocabee-test";

export async function savePersonalTestAction(rawJson: unknown) {
  const user = await requireVocabeerUser();

  const validation = validateVocabeeTestJson(rawJson);
  if (!validation.valid) {
    return {
      success: false as const,
      errors: validation.errors,
    };
  }

  const created = await PersonalTestRepository.createPersonalTest(user.id, validation.data);
  if (!created) {
    return {
      success: false as const,
      error: "Không thể lưu bài kiểm tra vào cơ sở dữ liệu. Vui lòng thử lại.",
    };
  }

  revalidatePath("/u/personal-test");
  revalidatePath("/personal-test");

  return {
    success: true as const,
    testId: created.id,
    summary: validation.summary,
  };
}

export async function updatePersonalTestTitleAction(testId: string, title: string) {
  const user = await requireVocabeerUser();

  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: "Tiêu đề không được để trống" };
  }

  const updated = await PersonalTestRepository.updatePersonalTest(testId, user.id, {
    title: trimmed,
  });

  if (!updated) {
    return { success: false, error: "Không thể cập nhật tiêu đề bài kiểm tra." };
  }

  revalidatePath("/u/personal-test");
  return { success: true };
}

export async function deletePersonalTestAction(testId: string) {
  const user = await requireVocabeerUser();

  const deleted = await PersonalTestRepository.deletePersonalTest(testId, user.id);
  if (!deleted) {
    return { success: false, error: "Không thể xóa bài kiểm tra." };
  }

  revalidatePath("/u/personal-test");
  return { success: true };
}

export async function startOrResumeAttemptAction(testId: string, mode: TestMode = "practice") {
  const user = await requireVocabeerUser();

  // Check for unfinished active session
  const active = await PersonalTestRepository.getActiveAttempt(testId, user.id);
  if (active) {
    return {
      success: true as const,
      attempt: active,
      isResumed: true,
    };
  }

  // Create new session
  const created = await PersonalTestRepository.createAttempt(testId, user.id, mode);
  if (!created) {
    return {
      success: false as const,
      error: "Không thể khởi tạo lượt làm bài kiểm tra.",
    };
  }

  return {
    success: true as const,
    attempt: created,
    isResumed: false,
  };
}

export async function saveAttemptProgressAction(
  attemptId: string,
  updates: {
    answers: Record<string, string>;
    currentSetIndex: number;
    currentExerciseIndex: number;
  }
) {
  const user = await requireVocabeerUser();

  const ok = await PersonalTestRepository.saveAttemptProgress(attemptId, user.id, updates);
  return { success: ok };
}

export async function submitAttemptAction(
  attemptId: string,
  answers: Record<string, string>
) {
  const user = await requireVocabeerUser();

  const result = await PersonalTestRepository.completeAttempt(attemptId, user.id, answers);
  if (!result) {
    return {
      success: false as const,
      error: "Không thể nộp bài hoặc chấm điểm. Vui lòng thử lại.",
    };
  }

  revalidatePath("/u/personal-test");
  revalidatePath(`/u/personal-test/${result.attempt.test_id}`);

  return {
    success: true as const,
    attemptId: result.attempt.id,
    testId: result.attempt.test_id,
    score: result.attempt.score,
    grading: result.grading,
  };
}
