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
    const { sessionId, questionId } = body ?? {};

    if (!sessionId || !questionId) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or questionId" },
        { status: 400 }
      );
    }

    const hint = await AdaptiveSessionStore.getHint(sessionId, user.id, questionId);

    return NextResponse.json({
      success: true,
      data: {
        hint: hint || "Hãy đọc kỹ ngữ cảnh câu và nghĩa của từ cần điền.",
      },
    });
  } catch (error) {
    console.error("[api/learning/adaptive/hint] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
