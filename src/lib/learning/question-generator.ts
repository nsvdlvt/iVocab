import {
  LearnQuestion,
  VocabularyRow,
  QuestionDirection,
  QuestionType,
} from "./question-types";
import { generateDistractors } from "./distractor-generator";

export class QuestionGenerator {
  static generate(params: {
    word: VocabularyRow;
    direction: QuestionDirection;
    type: QuestionType;
    distractorPool: VocabularyRow[];
    recentAskedIds?: string[];
  }): LearnQuestion {
    const { word, direction, type, distractorPool, recentAskedIds = [] } = params;

    let prompt = direction === "en-vi" ? word.word : word.meaning;
    let correctAnswer = direction === "en-vi" ? word.meaning : word.word;

    if (type === "word-dictation") {
      prompt = word.word;
      correctAnswer = word.word;
    } else if (type === "sentence-dictation") {
      prompt = word.example || "";
      correctAnswer = word.word;
    }

    let options: LearnQuestion["options"] = [];
    let correctOptionId = "";

    if (type === "mcq") {
      options = generateDistractors(word, direction, distractorPool, recentAskedIds);
      const correctOpt = options.find((opt) => opt.isCorrect);
      if (correctOpt) {
        correctOptionId = correctOpt.id;
      }
    }

    return {
      id: word.id,
      prompt,
      direction,
      type,
      options,
      correctOptionId,
      correctAnswer,
      word,
    };
  }
}
