import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { LearnMCQ } from "../LearnMCQ";
import { LearnQuestion } from "@/lib/learning/question-types";

describe("LearnMCQ", () => {
  const mockQuestion: LearnQuestion = {
    id: "w1",
    prompt: "tùy cơ ứng biến",
    direction: "vi-en",
    type: "mcq",
    correctOptionId: "opt-1",
    correctAnswer: "play it by ear",
    word: {
      id: "w1",
      owner_id: "u1",
      set_id: "s1",
      word: "play it by ear",
      meaning: "tùy cơ ứng biến",
      part_of_speech: "idiom",
      ipa: null,
      example: "Let's play it by ear.",
      example_translation: null,
      synonyms: ["improvise"],
      antonyms: null,
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "medium",
      source: null,
      deleted_at: null,
      fts_vector: null,
      is_starred: false,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
    options: [
      {
        id: "opt-1",
        text: "play it by ear",
        english: "play it by ear",
        meaning: "tùy cơ ứng biến",
        isCorrect: true,
      },
      {
        id: "opt-2",
        text: "on and off",
        english: "on and off",
        meaning: "thỉnh thoảng; không liên tục",
        isCorrect: false,
      },
      {
        id: "opt-3",
        text: "high and mighty",
        english: "high and mighty",
        meaning: "tự cao; trịch thượng",
        isCorrect: false,
      },
      {
        id: "opt-4",
        text: "bite the bullet",
        english: "bite the bullet",
        meaning: "cắn răng chịu đựng",
        isCorrect: false,
      },
    ],
  };

  it("while unanswered, displays only option text without revealing Vietnamese meanings to prevent answer leakage", () => {
    const html = renderToString(
      <LearnMCQ
        question={mockQuestion}
        selectedOptionId={null}
        answerState="unanswered"
        onSelectOption={vi.fn()}
      />
    );

    // Layout
    expect(html).toContain("grid-cols-1 sm:grid-cols-2");

    // Options text visible
    expect(html).toContain("play it by ear");
    expect(html).toContain("on and off");
    expect(html).toContain("high and mighty");
    expect(html).toContain("bite the bullet");

    // Distractor meanings MUST NOT be revealed in options while answering
    expect(html).not.toContain("thỉnh thoảng; không liên tục");
    expect(html).not.toContain("tự cao; trịch thượng");
    expect(html).not.toContain("cắn răng chịu đựng");
  });

  it("when submitted/answered, reveals English word on top with Vietnamese meaning below for all options", () => {
    const html = renderToString(
      <LearnMCQ
        question={mockQuestion}
        selectedOptionId="opt-1"
        answerState="correct"
        onSelectOption={vi.fn()}
      />
    );

    // Layout
    expect(html).toContain("grid-cols-1 sm:grid-cols-2");

    // Option 1: English + Meaning
    expect(html).toContain("play it by ear");
    expect(html).toContain("tùy cơ ứng biến");

    // Option 2: English + Meaning
    expect(html).toContain("on and off");
    expect(html).toContain("thỉnh thoảng; không liên tục");

    // Option 3: English + Meaning
    expect(html).toContain("high and mighty");
    expect(html).toContain("tự cao; trịch thượng");

    // Option 4: English + Meaning
    expect(html).toContain("bite the bullet");
    expect(html).toContain("cắn răng chịu đựng");
  });

  it("renders correct answer state with green background, green border, and check icon", () => {
    const html = renderToString(
      <LearnMCQ
        question={mockQuestion}
        selectedOptionId="opt-1"
        answerState="correct"
        onSelectOption={vi.fn()}
      />
    );

    expect(html).toContain("border-emerald-500");
    expect(html).toContain("bg-emerald-500/10");
    expect(html).toContain("lucide-check");
  });

  it("renders wrong selected answer with rose background, rose border, X icon, and reveals correct option with check icon", () => {
    const html = renderToString(
      <LearnMCQ
        question={mockQuestion}
        selectedOptionId="opt-2"
        answerState="wrong"
        onSelectOption={vi.fn()}
      />
    );

    // Selected wrong option
    expect(html).toContain("border-rose-500");
    expect(html).toContain("bg-rose-500/10");
    expect(html).toContain("lucide-x");

    // Correct option is also highlighted in green
    expect(html).toContain("border-emerald-500");
    expect(html).toContain("lucide-check");

    // Unselected options are neutral
    expect(html).toContain("border-border/70");
  });

  it("handles missing meaning gracefully without breaking layout", () => {
    const questionWithoutMeanings: LearnQuestion = {
      ...mockQuestion,
      word: {
        ...mockQuestion.word,
        word: "resilient",
        meaning: "",
      },
      correctAnswer: "resilient",
      options: [
        {
          id: "opt-1",
          text: "resilient",
          english: "resilient",
          meaning: "",
          isCorrect: true,
        },
        {
          id: "opt-2",
          text: "tenacious",
          english: "tenacious",
          meaning: "",
          isCorrect: false,
        },
      ],
    };

    const html = renderToString(
      <LearnMCQ
        question={questionWithoutMeanings}
        selectedOptionId={null}
        answerState="unanswered"
        onSelectOption={vi.fn()}
      />
    );

    expect(html).toContain("resilient");
    expect(html).toContain("tenacious");
    // Layout remains unbroken
    expect(html).toContain("min-h-[58px]");
  });

  it("handles long meanings gracefully with line-clamp and height alignment", () => {
    const questionWithLongMeaning: LearnQuestion = {
      ...mockQuestion,
      options: [
        {
          id: "opt-1",
          text: "ubiquitous",
          english: "ubiquitous",
          meaning: "có mặt ở khắp mọi nơi cùng một lúc; rất phổ biến trong đời sống hàng ngày",
          isCorrect: true,
        },
        {
          id: "opt-2",
          text: "scarce",
          english: "scarce",
          meaning: "hiếm",
          isCorrect: false,
        },
      ],
    };

    const html = renderToString(
      <LearnMCQ
        question={questionWithLongMeaning}
        selectedOptionId="opt-1"
        answerState="correct"
        onSelectOption={vi.fn()}
      />
    );

    expect(html).toContain("ubiquitous");
    expect(html).toContain("line-clamp-2");
    expect(html).toContain("h-full");
  });
});
