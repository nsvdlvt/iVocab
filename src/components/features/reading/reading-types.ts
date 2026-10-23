export type HighlightedWord = {
  text: string;
  start?: number;
  end?: number;
  vocabularyId?: string;
  highlightColor?: string;
  ipa?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  example_translation?: string;
  translatableText?: string;
};

export type BilingualParagraph = {
  id: string;
  source: string;
  translation?: string;
  highlightedWords?: HighlightedWord[];
};

export type BilingualDocument = {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  paragraphs: BilingualParagraph[];
};

export type ComprehensionQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  paragraphRef?: string;
};

export type ComprehensionProgress = {
  selectedAnswers: Record<string, number>;
  isSubmitted: boolean;
  score: number;
  completedAt?: string;
};

export type ReadingMode = "bilingual" | "english" | "vietnamese";

export type ReadingLesson = BilingualDocument & {
  slug?: string;
  topic: string;
  difficulty: string;
  estimatedReadingMinutes?: number;
  estimatedReadingTime: string;
  coverImageUrl?: string | null;
  vocabularyStats: {
    newWords: number;
    knownWords: number;
    totalHighlighted: number;
  };
  isFavorite: boolean;
  progress: number;
  lessonIndex: number;
  lessonCount: number;
  questions?: ComprehensionQuestion[];
  previousSlug?: string | null;
  nextSlug?: string | null;
};

export type ReadingHighlight = {
  id: string;
  articleId: string;
  paragraphId: string;
  language: "en" | "vi";
  selectedText: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
};
