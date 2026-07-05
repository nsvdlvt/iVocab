// src/lib/utils/lruCache.ts
/**
 * Generic Least‑Recently‑Used (LRU) cache implementation.
 *
 * Internally uses a `Map` to preserve insertion order. When a key is accessed
 * via `get`, the entry is removed and re‑inserted, moving it to the newer end
 * of the map – the behaviour of a true LRU cache.
 *
 * The cache evicts the least‑recently‑used entry when the configured
 * `maxSize` (default 100) would be exceeded.
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly map: Map<K, V>;

  constructor(maxSize: number = 100) {
    if (maxSize <= 0) {
      throw new Error("LRUCache maxSize must be > 0");
    }
    this.maxSize = maxSize;
    this.map = new Map();
  }

  /** Retrieve a value and mark it as recently used. */
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Refresh ordering: delete and set again moves it to the newest position.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /** Insert or update a value. Evicts LRU entry if capacity is exceeded. */
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      // Refresh ordering for existing key.
      this.map.delete(key);
    }
    this.map.set(key, value);
    this.evictIfNeeded();
  }

  /** Remove a specific entry. */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /** Clear the entire cache. */
  clear(): void {
    this.map.clear();
  }

  /** Number of entries currently stored. */
  get size(): number {
    return this.map.size;
  }

  /** Internal helper – evict the oldest entry until within capacity. */
  private evictIfNeeded(): void {
    while (this.map.size > this.maxSize) {
      // Map iteration order is insertion order; first key is LRU.
      const lruKey = this.map.keys().next().value;
      if (lruKey === undefined) break;
      this.map.delete(lruKey);
    }
  }

  /** Iterate over entries in LRU → MRU order (oldest first). */
  *entries(): IterableIterator<[K, V]> {
    for (const entry of this.map.entries()) {
      yield entry;
    }
  }
}
