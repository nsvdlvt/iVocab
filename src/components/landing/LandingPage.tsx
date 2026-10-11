"use client";

import React, { useState } from "react";
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
import {
  landingDemoFlashcard,
  landingDemoForecast,
  landingDemoProgress,
  landingDemoWeekly,
} from "./landing-data";
import { LearnQuestion } from "@/lib/learning/question-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const demoQuizQuestion: LearnQuestion = {
  id: landingDemoFlashcard.id,
  prompt: "peculiar",
  direction: "en-vi",
  type: "mcq",
  options: [
    { id: "a", text: "kỳ lạ, khác biệt riêng", isCorrect: true },
    { id: "b", text: "phổ biến, đại trà", isCorrect: false },
    { id: "c", text: "ngắn gọn, súc tích", isCorrect: false },
    { id: "d", text: "tạm thời, thoáng qua", isCorrect: false },
  ],
  correctOptionId: "a",
  correctAnswer: "kỳ lạ, khác biệt riêng",
  word: landingDemoFlashcard,
};

function ShowcaseSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  reverse = false,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={
        reverse
          ? "border-b border-border/60 bg-muted/30"
          : "border-b border-border/60 bg-background"
      }
    >
      <div
        className={`mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20 ${
          reverse ? "lg:[direction:rtl]" : ""
        }`}
      >
        <div className={`space-y-4 ${reverse ? "lg:[direction:ltr]" : ""}`}>
          <Badge variant="default" className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
            {eyebrow}
          </Badge>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
          {bullets && bullets.length > 0 && (
            <ul className="space-y-2 pt-2 text-sm text-foreground/90">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={reverse ? "lg:[direction:ltr]" : ""}>{children}</div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const [showcaseFlipped, setShowcaseFlipped] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  const quizAnswerState =
    selectedQuizOption === null
      ? "unanswered"
      : selectedQuizOption === demoQuizQuestion.correctOptionId
        ? "correct"
        : "wrong";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <LandingHero />
      <TrustedBy />
      <FeatureGrid />

      <ShowcaseSection
        id="showcase"
        eyebrow="Thẻ nhớ Flashcard 3D"
        title="Tập trung tuyệt đối vào từng từ vựng với thao tác lật thẻ mượt mà"
        description="Mỗi thẻ từ hiển thị trực quan từ vựng, phiên âm chuẩn quốc tế IPA, nghĩa tiếng Việt và câu ví dụ thực tế. Bạn có thể lật thẻ bằng chuột hoặc phím tắt để kiểm tra trí nhớ tức thì."
        bullets={[
          "Hỗ trợ phát âm chuẩn Anh-Mỹ và tự động đọc khi chuyển thẻ",
          "Đánh dấu từ khó (Star) để ưu tiên ôn tập chuyên sâu",
          "Giao diện tối giản giúp não bộ tập trung 100% vào ngữ nghĩa",
        ]}
      >
        <SectionCard className="border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <FlashcardDeck
            word={landingDemoFlashcard}
            flipped={showcaseFlipped}
            frontMode="term"
            autoSpeak={false}
            isStarred={false}
            readOnly
            onFlip={() => setShowcaseFlipped((prev) => !prev)}
            onSpeak={() => {}}
            onOpenSettings={() => {}}
            onToggleAutoSpeak={() => {}}
            onToggleStar={() => {}}
          />
        </SectionCard>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="Trắc nghiệm & AI Quiz"
        title="Kiểm tra phản xạ nhận diện từ vựng với câu hỏi tương tác"
        description="Hệ thống tự động sinh câu hỏi trắc nghiệm đa chiều (Anh - Việt, Việt - Anh, Điền từ vào câu) dựa trên chính bộ từ bạn đang học, kèm phản hồi đúng sai ngay lập tức."
        bullets={[
          "Chọn thử một đáp án bên cạnh để trải nghiệm phản hồi trực tiếp",
          "Phân tích các phương án gây nhiễu giúp tránh nhầm lẫn trong phòng thi",
          "Tự động ghi nhận kết quả vào tiến độ làm chủ từ vựng",
        ]}
        reverse
      >
        <SectionCard className="border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-3">
          {selectedQuizOption !== null && (
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs">
              <span className="font-semibold text-foreground">
                {quizAnswerState === "correct"
                  ? "Chính xác! Bạn đã nắm vững nghĩa của từ này."
                  : "Chưa chính xác. Hãy thử lại hoặc xem đáp án đúng."}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSelectedQuizOption(null)}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Làm lại
              </Button>
            </div>
          )}
          <LearnMCQ
            question={demoQuizQuestion}
            selectedOptionId={selectedQuizOption}
            answerState={quizAnswerState}
            onSelectOption={(id) => setSelectedQuizOption(id)}
            onSpeakPrompt={() => {}}
          />
        </SectionCard>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="Từ điển sâu & Ngữ cảnh"
        title="Hiểu trọn vẹn sắc thái nghĩa, từ đồng nghĩa và cách đặt câu"
        description="Biết nghĩa tiếng Việt là chưa đủ để đạt điểm cao trong IELTS Writing hay Speaking. Vocabee cung cấp đầy đủ từ loại, synonyms, antonyms và ghi chú ngữ cảnh sử dụng."
        bullets={[
          "Tra cứu tức thì cấu trúc câu mẫu và bản dịch song ngữ",
          "Mở rộng vốn từ nhanh chóng qua mạng lưới từ đồng nghĩa - trái nghĩa",
          "Ghi chú mẹo nhớ cá nhân ngay trên từng thẻ từ",
        ]}
      >
        <SectionCard className="border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <FlashcardViewer word={landingDemoFlashcard} />
        </SectionCard>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="Dự báo ôn tập SRS"
        title="Chủ động nắm bắt lịch ôn tập trong 7 ngày tới"
        description="Biểu đồ dự báo thông minh giúp bạn biết chính xác số lượng từ đến hạn ôn tập vào từng ngày trong tuần, từ đó phân bổ thời gian học hợp lý mà không bao giờ bị quá tải."
        bullets={[
          "Hiển thị trực quan khối lượng từ cần ôn hôm nay và các ngày tiếp theo",
          "Cảnh báo sớm ngày cao điểm để bạn chủ động sắp xếp lịch trình",
          "Tối ưu hóa điểm rơi trí nhớ theo đường cong quên lãng Ebbinghaus",
        ]}
        reverse
      >
        <SectionCard className="border-border/80 bg-card p-5 shadow-sm">
          <UpcomingReviewsForecast forecast={landingDemoForecast} />
        </SectionCard>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="Thống kê & Động lực"
        title="Theo dõi chuỗi ngày học (Streak) và mục tiêu hoàn thành mỗi ngày"
        description="Xây dựng thói quen học tập bền vững nhờ hệ thống theo dõi tiến độ trực quan. Mỗi từ vựng được học mới hay ôn tập đều đóng góp vào mục tiêu ngày và chuỗi Streak của bạn."
        bullets={[
          "Đặt mục tiêu số từ mỗi ngày phù hợp với quỹ thời gian cá nhân",
          "Theo dõi lịch sử hoạt động 7 ngày gần nhất rõ ràng, minh bạch",
          "Duy trì động lực học tập liên tục nhờ hiệu ứng hoàn thành mục tiêu",
        ]}
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
