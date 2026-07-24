"use client";

import React from "react";
import { LandingNavbar } from "./Navbar";
import { LandingHero } from "./Hero";
import { TrustedBy } from "./TrustedBy";
import { FeatureGrid } from "./FeatureGrid";
import { Timeline } from "./Timeline";
import { Statistics } from "./Statistics";
import { Testimonials } from "./Testimonials";
import { FAQ } from "./FAQ";
import { CTA } from "./CTA";
import { LandingFooter } from "./Footer";
import { SectionCard } from "@/components/common/SectionCard";
import { FlashcardDeck } from "@/components/features/flashcard/FlashcardDeck";
import { FlashcardViewer } from "@/components/features/review/FlashcardViewer";
import { LearnMCQ } from "@/components/features/learn/LearnMCQ";
import { DailyStreak } from "@/components/features/dashboard/DailyStreak";
import { LearningProgress } from "@/components/features/dashboard/LearningProgress";
import { UpcomingReviewsForecast } from "@/components/features/review/UpcomingReviewsForecast";
import { landingDemoFlashcard, landingDemoForecast, landingDemoProgress, landingDemoWeekly } from "./landing-data";
import { LearnQuestion } from "@/lib/learning/question-types";

const demoQuizQuestion: LearnQuestion = {
  id: landingDemoFlashcard.id,
  prompt: "peculiar",
  direction: "en-vi",
  type: "mcq",
  options: [
    { id: "a", text: "kỳ lạ", isCorrect: true },
    { id: "b", text: "phổ biến", isCorrect: false },
    { id: "c", text: "ngắn gọn", isCorrect: false },
    { id: "d", text: "đắt tiền", isCorrect: false },
  ],
  correctOptionId: "a",
  correctAnswer: "kỳ lạ",
  word: landingDemoFlashcard,
};

function ShowcaseSection({
  eyebrow,
  title,
  description,
  reverse = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={reverse ? "bg-slate-50" : "bg-white"}>
      <div className={`mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:px-6 lg:px-8 lg:grid-cols-2 ${reverse ? "lg:[direction:rtl]" : ""}`}>
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">{eyebrow}</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          <p className="max-w-xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <div className={reverse ? "lg:[direction:ltr]" : ""}>{children}</div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <LandingNavbar />
      <LandingHero />
      <TrustedBy />
      <FeatureGrid />
      <ShowcaseSection
        eyebrow="Flashcards"
        title="Một thẻ, một từ, một hành động rõ ràng"
        description="Flashcards là nơi người học chạm vào từ vựng nhiều nhất. Màn hình này cho thấy rõ trải nghiệm lật thẻ và nhịp học tập trung."
      >
        <SectionCard className="border-slate-200 bg-white p-4 shadow-sm">
          <FlashcardDeck
            word={landingDemoFlashcard}
            flipped={false}
            frontMode="term"
            autoSpeak={false}
            isStarred={false}
            readOnly
            onFlip={() => {}}
            onSpeak={() => {}}
            onOpenSettings={() => {}}
            onToggleAutoSpeak={() => {}}
            onToggleStar={() => {}}
          />
        </SectionCard>
      </ShowcaseSection>
      <ShowcaseSection
        eyebrow="AI Quiz"
        title="Câu hỏi trắc nghiệm với cảm giác như một bài luyện thi thật"
        description="Phần AI Quiz cần nhiều không gian để người dùng thấy rõ prompt, lựa chọn và cách ứng dụng phản hồi."
        reverse
      >
        <SectionCard className="border-slate-200 bg-slate-50 p-4 shadow-sm">
          <LearnMCQ
            question={demoQuizQuestion}
            selectedOptionId={null}
            answerState="unanswered"
            onSelectOption={() => {}}
            onSpeakPrompt={() => {}}
          />
        </SectionCard>
      </ShowcaseSection>
      <ShowcaseSection
        eyebrow="Dictionary"
        title="Từ điển và ngữ cảnh của từ"
        description="Người học cần thấy nghĩa, IPA, ví dụ và nhãn từ loại ngay lập tức. Đây là nơi sản phẩm trả lời câu hỏi 'từ này nghĩa là gì?'."
      >
        <SectionCard className="border-slate-200 bg-white p-4 shadow-sm">
          <FlashcardViewer word={landingDemoFlashcard} />
        </SectionCard>
      </ShowcaseSection>
      <ShowcaseSection
        eyebrow="SRS"
        title="Lịch ôn giúp người học biết phải quay lại lúc nào"
        description="SRS là lớp giữ chân. Một section riêng giúp biến lịch ôn thành tín hiệu trực quan, không chỉ là con số ở góc màn hình."
        reverse
      >
        <SectionCard className="border-slate-200 bg-slate-50 p-5 shadow-sm">
          <UpcomingReviewsForecast forecast={landingDemoForecast} />
        </SectionCard>
      </ShowcaseSection>
      <ShowcaseSection
        eyebrow="Dashboard"
        title="Bảng điều khiển cho thấy tiến độ thật sự"
        description="Dashboard cần một section riêng để làm nổi bật streak, mục tiêu và tiến trình học tập hàng ngày."
      >
        <div className="grid gap-4">
          <DailyStreak streak={14} weeklyActivity={landingDemoWeekly} />
          <LearningProgress progress={landingDemoProgress} />
        </div>
      </ShowcaseSection>
      <Timeline />
      <Statistics />
      <Testimonials />
      <FAQ />
      <CTA />
      <LandingFooter />
    </div>
  );
}
