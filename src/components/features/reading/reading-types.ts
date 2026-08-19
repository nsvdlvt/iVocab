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

export type ReadingLesson = BilingualDocument & {
  topic: string;
  difficulty: string;
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
};

export type ReadingHighlight = {
  id: string;
  articleId: string;
  paragraphId: string;
  language: "en" | "vi";
  selectedText: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
};
