import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { FlashcardViewer } from "@/components/features/review/FlashcardViewer";
import { ReviewControls } from "@/components/features/review/ReviewControls";
import { mockReviewWords } from "@/mock/review";
import { Progress } from "@/components/ui/progress";

export default function ReviewPage() {
  const currentWord = mockReviewWords[0]; // Statically display the first word in the queue
  const totalWords = mockReviewWords.length;
  const currentIndex = 1;
  const progressPercent = Math.round((currentIndex / totalWords) * 100);

  return (
    <PageContainer className="max-w-4xl space-y-6 md:space-y-8">
      <PageHeader
        title="Ôn tập từ vựng"
        description="Ôn tập các từ vựng đến hạn hôm nay để ghi nhớ sâu sắc hơn."
      />

      {/* Spaced Repetition queue progress */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Tiến trình ôn tập</span>
          <span>{currentIndex} / {totalWords} từ</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 rounded-full" />
      </div>

      {/* Card viewer & controls */}
      {currentWord ? (
        <div className="space-y-8">
          <FlashcardViewer word={currentWord} />
          <ReviewControls />
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground text-sm max-w-xl mx-auto">
          Chúc mừng! Bạn đã hoàn thành tất cả các thẻ ôn tập ngày hôm nay.
        </div>
      )}
    </PageContainer>
  );
}
