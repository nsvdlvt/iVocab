import { getCurrentUser } from "@/lib/auth/get-current-user";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

/**
 * Resolves a vocabulary set title for page metadata, supporting both user-owned and public sets.
 */
export async function getVocabSetMetadataTitle(setId: string, prefix?: string): Promise<string> {
  try {
    const user = await getCurrentUser();
    if (user) {
      const set = await VocabSetRepository.getVocabSetById(setId, user.id);
      if (set?.title) {
        return prefix ? `${prefix}: ${set.title}` : set.title;
      }
    }
    const publicSet = await VocabSetRepository.getPublicVocabSetById(setId);
    if (publicSet?.title) {
      return prefix ? `${prefix}: ${publicSet.title}` : publicSet.title;
    }
  } catch {}
  return prefix || "Bộ từ vựng";
}

/**
 * Resolves a review session title for page metadata.
 */
export async function getReviewSessionMetadataTitle(sessionId: string, prefix?: string): Promise<string> {
  try {
    const session = await ReviewSessionStore.get(sessionId);
    if (session?.title) {
      return prefix ? `${prefix}: ${session.title}` : `Phiên ôn tập: ${session.title}`;
    }
  } catch {}
  return prefix ? `${prefix} ôn tập` : "Phiên ôn tập";
}
