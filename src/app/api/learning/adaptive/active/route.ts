import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdaptiveSessionStore } from "@/lib/learning/adaptive-session-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId") || "";

    if (!setId) {
      return NextResponse.json({ success: false, error: "Missing setId" }, { status: 400 });
    }

    const activeSession = await AdaptiveSessionStore.getActiveSession(user.id, setId);

    if (!activeSession) {
      return NextResponse.json({
        success: true,
        hasActiveSession: false,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveSession: true,
      data: {
        sessionId: activeSession.session.sessionId,
        setId: activeSession.session.setId,
        stage: activeSession.session.stage,
        selectedWordIds: activeSession.session.selectedWordIds,
        currentCardIndex: activeSession.session.currentCardIndex,
        reviewedCardIds: activeSession.session.reviewedCardIds,
        currentQuestion: activeSession.currentQuestion,
        score: activeSession.session.score,
        streak: activeSession.session.streak,
        highestStreak: activeSession.session.highestStreak,
        answersCount: activeSession.session.answersHistory.length,
        totalWords: activeSession.session.words.size,
        updatedAt: activeSession.rawRow.updated_at,
      },
    });
  } catch (error) {
    console.error("[api/learning/adaptive/active] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
