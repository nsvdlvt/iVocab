import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { QuizProgress } from "@/components/features/quiz/QuizProgress";
import { QuizQuestion } from "@/components/features/quiz/QuizQuestion";
import { QuizOptions } from "@/components/features/quiz/QuizOptions";
import { QuizResultPlaceholder } from "@/components/features/quiz/QuizResultPlaceholder";
import { mockQuizQuestions } from "@/mock/quiz";

export default function QuizPage() {
  const currentQuestion = mockQuizQuestions[0];

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <PageHeader
        title="Trắc nghiệm ôn tập"
        description="Kiểm tra vốn từ vựng của bạn bằng các câu hỏi trắc nghiệm khách quan nhanh."
      />

      {currentQuestion ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          <QuizProgress current={1} total={mockQuizQuestions.length} />
          <QuizQuestion question={currentQuestion} />
          <QuizOptions
            options={currentQuestion.options}
            correctIndex={currentQuestion.correctOptionIndex}
          />
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed rounded-2xl text-muted-foreground text-sm">
          Không tìm thấy câu hỏi trắc nghiệm nào.
        </div>
      )}

      <hr className="border-border max-w-2xl mx-auto" />

      {/* Mock Score Summary Card at the bottom */}
      <div className="space-y-4">
        <h3 className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Xem trước giao diện kết quả hoàn thành bài thi
        </h3>
        <QuizResultPlaceholder />
      </div>
    </PageContainer>
  );
}
