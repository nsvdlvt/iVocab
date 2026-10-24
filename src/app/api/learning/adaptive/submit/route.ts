import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdaptiveSessionStore } from "@/lib/learning/adaptive-session-store";
import { ReviewRepository } from "@/repositories/review.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { LearningProgressService } from "@/lib/statistics/learning-progress.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId, questionId, selectedOptionIndex } = body ?? {};

    if (!sessionId || !questionId || typeof selectedOptionIndex !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: sessionId, questionId, selectedOptionIndex" },
        { status: 400 }
      );
    }

    // Evaluate answer on the server where answer key is kept secure
    const result = await AdaptiveSessionStore.submitAnswer(
      sessionId,
      user.id,
      questionId,
      selectedOptionIndex
    );

    // If this is an idempotent duplicate submission (e.g. rapid click or network retry),
    // skip repeating database SRS and activity logging
    if (!result.isDuplicateSubmission) {
      // Retrieve session to get vocabulary ID and set ID
      const session = await AdaptiveSessionStore.getSession(sessionId, user.id);
      const question = session?.questionBank.get(questionId);

      if (question) {
        // Record SRS review progress atomically
        try {
          const processed = await ReviewRepository.processResult({
            userId: user.id,
            vocabularyId: question.vocabularyId,
            mode: "learn",
            answerResult: result.isCorrect ? "correct" : "wrong",
          });

          // Record learning activity count
          if (processed) {
            result.updatedSrsLevel = processed.nextLevel;
            await LearningProgressService.recordActivity(user.id, 1, 0, "learn").catch((err) =>
              console.warn("[adaptive/submit] LearningProgressService error:", err)
            );
          }

          // Touch last studied at
          await VocabSetRepository.touchLastStudiedAtByVocabularyId(
            question.vocabularyId,
            user.id
          ).catch((err) => console.warn("[adaptive/submit] touchLastStudiedAt error:", err));
        } catch (dbError) {
          console.error("[adaptive/submit] Database progress update error:", dbError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[api/learning/adaptive/submit] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
