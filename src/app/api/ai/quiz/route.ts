import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiQuizRepository, MIN_AI_QUIZ_WORDS } from "@/repositories/ai-quiz.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { AIAbortError, AINetworkError, AIResponseError, AIValidationError } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const requestId = cryptoRandomId();
    console.info("[AI Quiz] request:start", { requestId });

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
    if (!setId) {
      return NextResponse.json({ success: false, error: "Missing setId" }, { status: 400 });
    }

    const vocabSet = await VocabSetRepository.getVocabSetById(setId, user.id);
    if (!vocabSet || vocabSet.deleted_at) {
      return NextResponse.json({ success: false, error: "Set not found" }, { status: 404 });
    }

    const quiz = await AiQuizRepository.generate(user.id, setId, request.signal);
    if (!quiz) {
      console.info("[AI Quiz] request:too-few-words", { requestId, setId });
      return NextResponse.json(
        { success: false, error: `Cần ít nhất ${MIN_AI_QUIZ_WORDS} từ vựng để tạo AI Quiz.` },
        { status: 400 }
      );
    }

    console.info("[AI Quiz] request:success", {
      requestId,
      setId,
      source: quiz.source ?? "ai",
      questionCount: quiz.questions.length,
    });
    return NextResponse.json({ success: true, data: quiz });
  } catch (error: unknown) {
    console.error("[AI Quiz] request:error", error instanceof Error ? { message: error.message, name: error.name } : error);
    return NextResponse.json(
      { success: false, error: getFriendlyQuizError(error) },
      { status: getStatusCode(error) }
    );
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10);
}

function getStatusCode(error: unknown): number {
  if (error instanceof AIValidationError) return 422;
  if (error instanceof AIAbortError) return 408;
  if (error instanceof AINetworkError) return 503;
  if (error instanceof AIResponseError) return 502;
  return 500;
}

function getFriendlyQuizError(error: unknown): string {
  if (error instanceof AIValidationError) return "AI trả về dữ liệu AI Quiz không hợp lệ. Vui lòng thử lại.";
  if (error instanceof AIAbortError) return "Yêu cầu bị gián đoạn hoặc quá thời gian. Vui lòng thử lại.";
  if (error instanceof AINetworkError) return "Không thể kết nối tới AI. Vui lòng kiểm tra mạng và thử lại.";
  if (error instanceof AIResponseError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit")) return "Hệ thống AI đang bận. Vui lòng thử lại sau ít phút.";
    if (msg.includes("quota")) return "Hạn mức AI đã hết. Vui lòng thử lại sau.";
    if (msg.includes("json")) return "AI trả về định dạng không hợp lệ. Vui lòng thử lại.";
    return "Không thể tạo AI Quiz. Vui lòng thử lại.";
  }
  return "Không thể tạo AI Quiz. Vui lòng thử lại.";
}
