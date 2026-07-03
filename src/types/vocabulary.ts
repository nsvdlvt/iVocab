export interface VocabularyWord {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "pronoun" | "interjection";
  definition: string;
  example: string;
  exampleTranslation: string;
  status: "new" | "learning" | "mastered";
}

export interface VocabularySet {
  id: string;
  title: string;
  description: string;
  category: "IELTS" | "TOEIC" | "Giao tiếp" | "Cơ bản" | "Nâng cao";
  totalWords: number;
  learnedWords: number;
  imageUrl?: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  words?: VocabularyWord[];
}
