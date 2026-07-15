import { AnswerState } from "./question-types";

export type AnswerCheckMode = "english-word" | "vietnamese-meaning";

export interface VietnameseAnswerOptions {
  synonyms?: string[];
}

const VIETNAMESE_STOP_WORDS = new Set([
  "a",
  "anh",
  "be",
  "bi",
  "cho",
  "con",
  "cua",
  "de",
  "di",
  "do",
  "gia",
  "giong",
  "hay",
  "la",
  "mot",
  "nhu",
  "nhung",
  "o",
  "qua",
  "rat",
  "roi",
  "se",
  "tai",
  "va",
  "voi",
  "y",
]);

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEnglishAnswer(value: string): string {
  return collapseWhitespace(value).toLowerCase();
}

export function normalizeVietnameseAnswer(value: string): string {
  return collapseWhitespace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function tokenizeVietnamese(value: string): string[] {
  return normalizeVietnameseAnswer(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length > 1)
    .filter((token) => !VIETNAMESE_STOP_WORDS.has(token));
}

function normalizeTokenSet(value: string): Set<string> {
  return new Set(tokenizeVietnamese(value));
}

export function checkEnglishAnswer(inputValue: string, expectedAnswer: string): AnswerState {
  return normalizeEnglishAnswer(inputValue) === normalizeEnglishAnswer(expectedAnswer) ? "correct" : "wrong";
}

function countMatchingVietnameseKeywords(inputTokens: Set<string>, expectedTokens: string[]): number {
  let matches = 0;
  for (const token of expectedTokens) {
    if (inputTokens.has(token)) {
      matches += 1;
    }
  }
  return matches;
}

function isVietnameseAnswerCorrect(inputValue: string, expectedAnswer: string): boolean {
  const inputTokens = normalizeTokenSet(inputValue);
  const expectedTokens = tokenizeVietnamese(expectedAnswer);

  if (expectedTokens.length === 0) {
    return false;
  }

  if (expectedTokens.length < 2) {
    return countMatchingVietnameseKeywords(inputTokens, expectedTokens) === expectedTokens.length;
  }

  return countMatchingVietnameseKeywords(inputTokens, expectedTokens) >= 2;
}

export function checkVietnameseAnswer(
  inputValue: string,
  expectedAnswer: string,
  options: VietnameseAnswerOptions = {}
): AnswerState {
  const candidates = [expectedAnswer, ...(options.synonyms ?? [])].filter((item) => item.trim().length > 0);

  for (const candidate of candidates) {
    if (isVietnameseAnswerCorrect(inputValue, candidate)) {
      return "correct";
    }
  }

  return "wrong";
}

export function checkAnswer(
  inputValue: string,
  expectedAnswers: string[],
  mode: AnswerCheckMode = "english-word",
  options: VietnameseAnswerOptions = {}
): AnswerState {
  if (mode === "vietnamese-meaning") {
    for (const expected of expectedAnswers) {
      if (checkVietnameseAnswer(inputValue, expected, options) === "correct") {
        return "correct";
      }
    }
    return "wrong";
  }

  for (const expected of expectedAnswers) {
    if (checkEnglishAnswer(inputValue, expected) === "correct") {
      return "correct";
    }
  }

  return "wrong";
}
