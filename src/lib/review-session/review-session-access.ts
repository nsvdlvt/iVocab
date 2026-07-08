import { notFound } from "next/navigation";
import { ReviewSessionStore } from "./review-session-store";

export function requireReviewSession(sessionId: string) {
  const session = ReviewSessionStore.get(sessionId);
  if (!session) {
    notFound();
  }
  return session;
}
