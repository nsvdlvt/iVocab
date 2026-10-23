import type { DictionaryResult, DictionarySuggestion } from "@/types/dictionary";

export interface DictionaryLookupOptions {
  signal?: AbortSignal;
  pos?: string;
  contextSentence?: string;
}

export interface IDictionaryProvider {
  readonly name: string;
  lookup(word: string, options?: DictionaryLookupOptions): Promise<DictionaryResult | null>;
}

export interface ISuggestionProvider {
  readonly name: string;
  suggest(query: string, signal?: AbortSignal): Promise<DictionarySuggestion[]>;
}
