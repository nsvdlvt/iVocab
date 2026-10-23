import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { AdaptiveSessionStore } from "@/lib/learning/adaptive-session-store";
import { getDefaultSelectedWordIds } from "@/lib/learning/mastery-selection";

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
    const setId = typeof body?.setId === "string" ? body.setId : "";
    const selectedWordIds = Array.isArray(body?.selectedWordIds) ? (body.selectedWordIds as string[]) : null;
    const initialStage = body?.stage === "practice" ? "practice" : "flashcards";

    if (!setId) {
      return NextResponse.json({ success: false, error: "Missing setId" }, { status: 400 });
    }

    const vocabSet = await VocabSetRepository.getVocabSetById(setId, user.id);
    if (!vocabSet || vocabSet.deleted_at) {
      return NextResponse.json({ success: false, error: "Bộ từ vựng không tồn tại hoặc đã bị xóa." }, { status: 404 });
    }

    const wordsWithReview = await ReviewRepository.getBySetId(user.id, setId);
    if (!wordsWithReview || wordsWithReview.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bộ từ vựng chưa có từ nào để luyện tập." },
        { status: 400 }
      );
    }

    // Filter by exact user selection, or fallback to mastery-based default 10
    let targetWords = wordsWithReview;
    if (selectedWordIds && selectedWordIds.length > 0) {
      const selectedSet = new Set(selectedWordIds);
      targetWords = wordsWithReview.filter((w) => selectedSet.has(w.id));
      if (targetWords.length === 0) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy từ vựng hợp lệ trong danh sách đã chọn." },
          { status: 400 }
        );
      }
    } else {
      const defaultIds = new Set(getDefaultSelectedWordIds(wordsWithReview, 10));
      targetWords = wordsWithReview.filter((w) => defaultIds.has(w.id));
    }

    const { sessionId, firstQuestion, totalWords, stage } = await AdaptiveSessionStore.createSession(
      user.id,
      setId,
      targetWords,
      { initialStage }
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        firstQuestion,
        totalWords,
        stage,
        selectedWordIds: targetWords.map((w) => w.id),
        setTitle: vocabSet.title,
      },
    });
  } catch (error) {
    console.error("[api/learning/adaptive/start] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
