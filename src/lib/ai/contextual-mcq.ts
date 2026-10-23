import {
  contextualMcqBatchSchema,
  type ContextualMcqQuestion,
  type ContextualMcqBatch,
} from "./schemas/contextual-mcq";
import {
  buildContextualMcqPrompt,
  type ContextualMcqVocabInput,
} from "./prompts/contextual-mcq";
import { extractJsonPayload, requestTextResponse } from "./json-response";
import { AIResponseError, AIValidationError } from "./errors";

/**
 * Deterministically validates an AI-generated contextual MCQ question.
 * Returns null if valid, or a string describing the validation failure.
 */
export function validateContextualMcqQuestion(
  q: ContextualMcqQuestion,
  vocabLookup?: Map<string, ContextualMcqVocabInput>
): string | null {
  if (!q.sentence || !q.sentence.includes("______")) {
    return "Sentence does not contain the required blank '______'";
  }

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return `Expected exactly 4 options, got ${q.options?.length}`;
  }

  // Check unique options
  const uniqueOptions = new Set(q.options.map((o) => o.trim().toLowerCase()));
  if (uniqueOptions.size !== 4) {
    return "Question contains duplicate options";
  }

  if (
    typeof q.correctAnswerIndex !== "number" ||
    q.correctAnswerIndex < 0 ||
    q.correctAnswerIndex > 3
  ) {
    return `correctAnswerIndex out of range: ${q.correctAnswerIndex}`;
  }

  const correctOption = q.options[q.correctAnswerIndex]?.trim().toLowerCase();
  const targetWord = q.targetWord.trim().toLowerCase();

  // Allow word or standard inflected forms (e.g. reaches, reached, reaching)
  const isMatch =
    correctOption === targetWord ||
    correctOption.startsWith(targetWord) ||
    targetWord.startsWith(correctOption) ||
    correctOption.includes(targetWord);

  if (!isMatch) {
    return `Correct option "${correctOption}" does not match target word "${targetWord}"`;
  }

  if (!q.explanation || q.explanation.trim().length < 5) {
    return "Explanation is missing or too short";
  }

  if (
    q.strongestDistractor &&
    q.strongestDistractor.trim().toLowerCase() === correctOption
  ) {
    return "Strongest distractor cannot be the correct answer";
  }

  return null;
}

/**
 * Post-processes question text to prevent obvious phonetic / article giveaways.
 * E.g., replacing "a ______" or "an ______" with "a/an ______" if options have mixed starting vowels.
 */
export function sanitizeQuestionGiveaways(q: ContextualMcqQuestion): ContextualMcqQuestion {
  let sanitizedSentence = q.sentence;

  // Check if options have mixed vowel/consonant starts
  const startsWithVowel = (str: string) => /^[aeiou]/i.test(str.trim());
  const vowelFlags = q.options.map(startsWithVowel);
  const hasMixedArticles = vowelFlags.some(Boolean) && vowelFlags.some((f) => !f);

  if (hasMixedArticles) {
    sanitizedSentence = sanitizedSentence.replace(
      /\b(a|an)\s+______/gi,
      "a/an ______"
    );
  }

  // Ensure options are trimmed
  const cleanOptions = q.options.map((o) => o.trim());

  return {
    ...q,
    sentence: sanitizedSentence,
    options: cleanOptions,
  };
}

/**
 * High-quality deterministic fallback question generator when AI is offline or times out.
 * Ensures the learner is never blocked.
 */
export function generateDeterministicFallbackQuestions(
  items: ContextualMcqVocabInput[]
): ContextualMcqQuestion[] {
  if (items.length === 0) return [];

  const questions: ContextualMcqQuestion[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const otherItems = items.filter((_, idx) => idx !== i);

    // Pick 3 distractors from the same vocabulary set or related words
    const candidateDistractors = otherItems
      .filter((o) => (o.partOfSpeech && item.partOfSpeech ? o.partOfSpeech === item.partOfSpeech : true))
      .map((o) => o.word);

    // Fallback common distractors if set has few words
    const standardDistractors = [
      "achieve",
      "acquire",
      "maintain",
      "enhance",
      "clarify",
      "address",
      "implement",
      "sustain",
    ];

    const distractorPool = [
      ...candidateDistractors,
      ...standardDistractors.filter((w) => w.toLowerCase() !== item.word.toLowerCase()),
    ];

    const chosenDistractors: string[] = [];
    for (const d of distractorPool) {
      if (chosenDistractors.length >= 3) break;
      if (
        d.toLowerCase() !== item.word.toLowerCase() &&
        !chosenDistractors.includes(d)
      ) {
        chosenDistractors.push(d);
      }
    }

    // Build 4 options with randomized position
    const correctIndex = Math.floor(Math.random() * 4);
    const options: string[] = [];
    let dIndex = 0;

    for (let pos = 0; pos < 4; pos++) {
      if (pos === correctIndex) {
        options.push(item.word);
      } else {
        options.push(chosenDistractors[dIndex] || `option_${pos + 1}`);
        dIndex++;
      }
    }

    const sentence = item.example && item.example.toLowerCase().includes(item.word.toLowerCase())
      ? item.example.replace(new RegExp(`\\b${escapeRegExp(item.word)}\\b`, "gi"), "______")
      : `In this professional context, it is crucial to ______ the required requirements effectively.`;

    const strongestDistractor = chosenDistractors[0] || options[(correctIndex + 1) % 4];

    questions.push({
      id: `fallback_${item.id}_${Date.now()}_${i}`,
      vocabularyId: item.id,
      targetWord: item.word,
      questionType: "contextual_mcq",
      difficulty: "medium",
      prompt: "Chọn từ hoặc cụm từ phù hợp nhất theo ngữ cảnh:",
      sentence: sentence.includes("______") ? sentence : `Please choose the best term: "______" (${item.meaning}).`,
      options,
      correctAnswerIndex: correctIndex,
      explanation: `"${item.word}" mang nghĩa: ${item.meaning}. Trong ngữ cảnh câu, từ này tạo thành cấu trúc tự nhiên và chính xác nhất.`,
      exampleTranslation: item.example_translation || null,
      strongestDistractor,
      whyDistractorWrong: `"${strongestDistractor}" có nghĩa hoặc sắc thái không tương thích hoàn toàn với ngữ cảnh này so với "${item.word}".`,
      hint: `Từ cần tìm có nghĩa là "${item.meaning}".`,
    });
  }

  return questions;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generates and validates contextual MCQs using the configured AI provider.
 */
export async function generateContextualMcqs(
  items: ContextualMcqVocabInput[],
  targetCount = 5,
  signal?: AbortSignal
): Promise<ContextualMcqQuestion[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const prompt = buildContextualMcqPrompt(items, targetCount);
  const vocabMap = new Map<string, ContextualMcqVocabInput>(items.map((i) => [i.id, i]));

  try {
    const rawText = await requestTextResponse(prompt, signal);
    const parsed = extractJsonPayload(rawText);
    const validated = contextualMcqBatchSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn(
        "[contextual-mcq] Schema validation failed:",
        validated.error.message
      );
      throw new AIValidationError(
        `Invalid contextual MCQ format: ${validated.error.message}`
      );
    }

    const validQuestions: ContextualMcqQuestion[] = [];

    for (const rawQ of validated.data.questions) {
      const sanitized = sanitizeQuestionGiveaways(rawQ);
      const validationError = validateContextualMcqQuestion(sanitized, vocabMap);

      if (!validationError) {
        validQuestions.push(sanitized);
      } else {
        console.warn(
          "[contextual-mcq] Question validation rejected:",
          validationError,
          rawQ.targetWord
        );
      }
    }

    if (validQuestions.length >= 2) {
      return validQuestions;
    }

    console.info(
      "[contextual-mcq] Too few questions passed validation, complementing with deterministic fallback."
    );
    const fallbacks = generateDeterministicFallbackQuestions(items);
    return [...validQuestions, ...fallbacks].slice(0, Math.max(targetCount, 4));
  } catch (error) {
    console.error(
      "[contextual-mcq] AI generation failed or timed out, using fallback generator:",
      error instanceof Error ? error.message : error
    );
    return generateDeterministicFallbackQuestions(items).slice(
      0,
      Math.max(targetCount, 4)
    );
  }
}
