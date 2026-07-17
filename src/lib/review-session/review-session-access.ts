import { notFound } from "next/navigation";
import { ReviewSessionStore } from "./review-session-store";

export async function requireReviewSession(sessionId: string) {
  const session = await ReviewSessionStore.get(sessionId);
  if (!session) {
    notFound();
  }
  return session;
}
