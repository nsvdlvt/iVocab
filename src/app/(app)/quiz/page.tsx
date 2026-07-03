import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { QuizClient } from "@/components/features/quiz/QuizClient";
import { requireUser } from "@/lib/auth/require-user";
import { QuizRepository, MIN_QUIZ_WORDS } from "@/repositories/quiz.repository";
import { Gamepad2, BookOpen } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const profile = await requireUser();
  const questions = await QuizRepository.generateQuestions(profile.id, 10);

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <PageHeader
        title="Trắc nghiệm ôn tập"
        description="Kiểm tra vốn từ vựng của bạn bằng các câu hỏi trắc nghiệm khách quan nhanh."
      />

      {questions.length === 0 ? (
        /* Empty state — not enough words */
        <div className="max-w-xl mx-auto text-center py-16 space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-5">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Chưa đủ từ vựng để làm bài!</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Bạn cần ít nhất <strong>{MIN_QUIZ_WORDS}</strong> từ vựng để tạo bài trắc nghiệm.
              Hãy thêm từ vựng vào bộ học trước rồi quay lại đây.
            </p>
          </div>
          <Link
            href={ROUTES.VOCABULARY}
            className={buttonVariants({
              className: "rounded-xl cursor-pointer gap-2",
            })}
          >
            <BookOpen className="h-4 w-4" />
            Quản lý từ vựng
          </Link>
        </div>
      ) : (
        <QuizClient questions={questions} />
      )}
    </PageContainer>
  );
}
