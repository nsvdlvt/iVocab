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

export type BilingualSection = {
  id: string;
  sourceTitle?: string;
  translatedTitle?: string;
  blocks: BilingualParagraph[];
};

export type BilingualDocument = {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  sections: BilingualSection[];
};

export type ReadingLesson = BilingualDocument & {
  topic: string;
  difficulty: string;
  estimatedReadingTime: string;
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
