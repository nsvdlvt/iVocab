import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdaptiveSessionStore } from "@/lib/learning/adaptive-session-store";

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
    const { sessionId, stage, currentCardIndex, reviewedCardIds } = body ?? {};

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    await AdaptiveSessionStore.saveCheckpoint(sessionId, user.id, {
      stage,
      currentCardIndex,
      reviewedCardIds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/learning/adaptive/save-progress] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
