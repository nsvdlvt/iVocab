import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { StudyExplanation } from "../StudyExplanation";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

describe("StudyExplanation", () => {
  const mockWord: VocabularyRow = {
    id: "w1",
    owner_id: "u1",
    set_id: "s1",
    word: "play it by ear",
    meaning: "tùy cơ ứng biến",
    part_of_speech: "idiom",
    ipa: "/pleɪ ɪt baɪ ɪə/",
    example: "We don't have a strict schedule, let's play it by ear.",
    example_translation: "Chúng ta không có lịch trình cụ thể, hãy tùy cơ ứng biến.",
    synonyms: ["improvise", "ad-lib"],
    antonyms: null,
    note: "Dùng trong giao tiếp thân mật",
    image_url: null,
    audio_url: null,
    difficulty: "medium",
    source: null,
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  it("renders compact feedback bar on correct answer with status, correct word, pronunciation button, example, and continue button", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="correct"
        onContinue={vi.fn()}
        autoContinue={false}
      />
    );

    // Status
    expect(html).toContain("Chính xác");
    // No redundant decorative icons
    expect(html).not.toContain("lucide-circle-check");

    // Correct answer word
    expect(html).toContain("play it by ear");

    // Pronunciation button
    expect(html).toContain("lucide-volume2");

    // Single example sentence
    expect(html).toContain("We don&#x27;t have a strict schedule, let&#x27;s play it by ear.");

    // Synonyms formatted with semicolon
    expect(html).toContain("Đồng nghĩa: ");
    expect(html).toContain("improvise; ad-lib");

    // Continue CTA with Enter
    expect(html).toContain("Tiếp tục");
    expect(html).toContain("Enter");
  });

  it("renders compact feedback on wrong answer with 'Chưa chính xác' and light pink background", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="wrong"
        onContinue={vi.fn()}
        autoContinue={false}
      />
    );

    expect(html).toContain("Chưa chính xác");
    expect(html).not.toContain("lucide-circle-x");
    expect(html).toContain("bg-rose-50/60");
    expect(html).toContain("border-rose-200/80");
    expect(html).toContain("play it by ear");
    expect(html).toContain("Tiếp tục");
  });

  it("does not render bulky nested cards or distractors explanation", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="correct"
        onContinue={vi.fn()}
        autoContinue={false}
      />
    );

    // Should NOT have the old bulky headers or distractors feedback
    expect(html).not.toContain("Lý do lựa chọn");
    expect(html).not.toContain("Phân biệt với đáp án gây nhiễu");
  });

  it("renders long phrases completely without truncation or ellipsis", () => {
    const longWord: VocabularyRow = {
      ...mockWord,
      word: "stacked in complete disarray",
      meaning: "chất đống trong sự bừa bộn hoàn toàn",
    };

    const html = renderToString(
      <StudyExplanation
        word={longWord}
        answerState="wrong"
        onContinue={vi.fn()}
        autoContinue={false}
      />
    );

    expect(html).toContain("stacked in complete disarray");
    expect(html).not.toContain("stacked in complet...");
    expect(html).not.toContain("truncate");
  });

  it("displays Vietnamese meaning as expected answer when question direction is en-vi", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="correct"
        onContinue={vi.fn()}
        autoContinue={false}
        direction="en-vi"
        correctAnswer="tùy cơ ứng biến"
      />
    );

    // Target answer displays Vietnamese requested answer
    expect(html).toContain("Đáp án đúng:");
    expect(html).toContain("tùy cơ ứng biến");

    // Full vocabulary details are also displayed
    expect(html).toContain("play it by ear");
    expect(html).toContain("/pleɪ ɪt baɪ ɪə/");
    expect(html).toContain("idiom");
    expect(html).toContain("Nghĩa:");
    expect(html).toContain("Ví dụ:");
    expect(html).toContain("Chúng ta không có lịch trình cụ thể, hãy tùy cơ ứng biến.");
  });

  it("displays English word as expected answer when question direction is vi-en", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="wrong"
        onContinue={vi.fn()}
        autoContinue={false}
        direction="vi-en"
        correctAnswer="play it by ear"
      />
    );

    expect(html).toContain("Chưa chính xác");
    expect(html).toContain("Đáp án đúng:");
    expect(html).toContain("play it by ear");
    expect(html).toContain("idiom");
    expect(html).toContain("/pleɪ ɪt baɪ ɪə/");
    expect(html).toContain("tùy cơ ứng biến");
  });

  it("renders autoplay explanation audio switch when toggle callback is provided", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="correct"
        onContinue={vi.fn()}
        autoContinue={false}
        autoPlayExplanationAudio={true}
        onToggleAutoPlayExplanation={vi.fn()}
      />
    );

    expect(html).toContain("Tự động phát âm thanh giải thích");
    expect(html).toContain("role=\"switch\"");
    expect(html).toContain("aria-checked=\"true\"");
  });

  it("renders disabled state on switch when autoPlayExplanationAudio is false", () => {
    const html = renderToString(
      <StudyExplanation
        word={mockWord}
        answerState="correct"
        onContinue={vi.fn()}
        autoContinue={false}
        autoPlayExplanationAudio={false}
        onToggleAutoPlayExplanation={vi.fn()}
      />
    );

    expect(html).toContain("aria-checked=\"false\"");
  });

  it("renders the 5-line minimal layout requested with single light-pink container for wrong answers", () => {
    const exhaustiveWord: VocabularyRow = {
      ...mockWord,
      word: "Exhaustive",
      ipa: "/ɪɡˈzɔːstɪv/",
      part_of_speech: "adjective",
      synonyms: ["Comprehensive", "Thorough", "Extensive"],
      meaning: "Toàn diện; thấu đáo; bao quát mọi khía cạnh",
      example: "The researchers conducted an exhaustive investigation into the causes of the accident.",
      example_translation: null,
    };

    const html = renderToString(
      <StudyExplanation
        word={exhaustiveWord}
        answerState="wrong"
        onContinue={vi.fn()}
        autoContinue={false}
        autoPlayExplanationAudio={true}
        onToggleAutoPlayExplanation={vi.fn()}
        correctAnswer="Exhaustive"
      />
    );

    // Single container with light pink background and thin border
    expect(html).toContain("bg-rose-50/60");
    expect(html).toContain("border-rose-200/80");

    // Line 1: Chưa chính xác | Đáp án đúng: Exhaustive | Auto Sound
    expect(html).toContain("Chưa chính xác");
    expect(html).toContain("Đáp án đúng:");
    expect(html).toContain("Exhaustive");
    expect(html).toContain("Auto Sound");

    // Line 2: Exhaustive | IPA | adjective
    expect(html).toContain("/ɪɡˈzɔːstɪv/");
    expect(html).toContain("adjective");

    // Line 3: Đồng nghĩa: Comprehensive; Thorough; Extensive
    expect(html).toContain("Đồng nghĩa: ");
    expect(html).toContain("Comprehensive; Thorough; Extensive");

    // Line 4: Nghĩa: Toàn diện; thấu đáo; bao quát mọi khía cạnh
    expect(html).toContain("Nghĩa: ");
    expect(html).toContain("Toàn diện; thấu đáo; bao quát mọi khía cạnh");

    // Line 5: Ví dụ: The researchers conducted an exhaustive investigation into the causes of the accident.
    expect(html).toContain("Ví dụ: ");
    expect(html).toContain("The researchers conducted an exhaustive investigation into the causes of the accident.");

    // No sub-boxes or cards
    expect(html).not.toContain("bg-card");
    expect(html).not.toContain("grid-cols");
  });
});
