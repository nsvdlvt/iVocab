interface RateLimitEntry {
  timestamps: number[];
  activeGeneration: boolean;
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 8;

const store = new Map<string, RateLimitEntry>();

export function acquireGenerationSlot(userId: string): {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = store.get(userId) ?? { timestamps: [], activeGeneration: false };

  if (entry.activeGeneration) {
    return {
      allowed: false,
      reason: "Bạn đang có một yêu cầu tạo bài kiểm tra đang xử lý. Vui lòng đợi hoàn tất.",
      retryAfterSeconds: 10,
    };
  }

  // Prune old timestamps outside sliding window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = entry.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
    );
    store.set(userId, entry);
    return {
      allowed: false,
      reason: `Bạn đã tạo quá nhiều bài kiểm tra liên tiếp. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
      retryAfterSeconds,
    };
  }

  entry.activeGeneration = true;
  entry.timestamps.push(now);
  store.set(userId, entry);

  return { allowed: true };
}

export function releaseGenerationSlot(userId: string): void {
  const entry = store.get(userId);
  if (entry) {
    entry.activeGeneration = false;
    store.set(userId, entry);
  }
}

export function resetGenerationRateLimitForTesting(): void {
  store.clear();
}
