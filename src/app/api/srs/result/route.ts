import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/repositories/review.repository";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vocabularyId, mode, answerResult, reviewSessionId } = body ?? {};

    if (!vocabularyId || !mode || !answerResult) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    await ReviewRepository.processResult({
      userId: user.id,
      vocabularyId,
      mode,
      answerResult,
    });

    if (mode === "review" && reviewSessionId) {
      const session = ReviewSessionStore.markCompleted(reviewSessionId, vocabularyId);
      if (session && ReviewSessionStore.isComplete(session)) {
        ReviewSessionStore.delete(reviewSessionId);
        return NextResponse.json({ success: true, completed: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
