import { AnswerState } from "./question-types";

// Normalized string comparison function
export function cleanVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[đĐ]/g, "d")
    .replace(/[đ]/g, "d")
    .trim()
    .replace(/\s+/g, " "); // collapse spaces
}

export function calculateLevenshtein(a: string, b: string): number {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        tmp[i][j] = tmp[i - 1][j - 1];
      } else {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1, // deletion
          tmp[i][j - 1] + 1, // insertion
          tmp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return tmp[a.length][b.length];
}

export function checkAnswer(
  inputValue: string,
  expectedAnswers: string[]
): AnswerState {
  const cleanedInput = cleanVietnamese(inputValue);
  let matched = false;
  let isNearly = false;

  for (const expected of expectedAnswers) {
    const cleanedExpected = cleanVietnamese(expected);
    if (cleanedInput === cleanedExpected) {
      matched = true;
      break;
    }

    const distance = calculateLevenshtein(cleanedInput, cleanedExpected);
    if (distance <= 2 && cleanedExpected.length > 3) {
      isNearly = true;
    }
  }

  if (matched) return "correct";
  if (isNearly) return "near";
  return "wrong";
}
