import { LRUCache } from "@/lib/utils/lruCache";
import type { DictionaryResult, DictionarySuggestion } from "@/types/dictionary";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ExpiringLRUCache<K, V> {
  private cache: LRUCache<K, CacheEntry<V>>;
  private defaultTtlMs: number;

  constructor(maxSize = 300, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.cache = new LRUCache<K, CacheEntry<V>>(maxSize);
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global server-side caches
declare global {
  var __ivocab_dictionary_cache: ExpiringLRUCache<string, DictionaryResult> | undefined;
  var __ivocab_suggestions_cache: ExpiringLRUCache<string, DictionarySuggestion[]> | undefined;
  var __ivocab_translation_cache: ExpiringLRUCache<string, string> | undefined;
}

export const dictionaryCache =
  globalThis.__ivocab_dictionary_cache ??
  new ExpiringLRUCache<string, DictionaryResult>(500, 24 * 60 * 60 * 1000);

export const suggestionsCache =
  globalThis.__ivocab_suggestions_cache ??
  new ExpiringLRUCache<string, DictionarySuggestion[]>(1000, 12 * 60 * 60 * 1000);

export const translationCache =
  globalThis.__ivocab_translation_cache ??
  new ExpiringLRUCache<string, string>(1000, 24 * 60 * 60 * 1000);

if (process.env.NODE_ENV !== "production") {
  globalThis.__ivocab_dictionary_cache = dictionaryCache;
  globalThis.__ivocab_suggestions_cache = suggestionsCache;
  globalThis.__ivocab_translation_cache = translationCache;
}
