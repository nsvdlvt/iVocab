import { NextResponse } from "next/server";
import { importVocabulary } from "@/lib/ai/import-vocabulary";
import { createClient } from "@/lib/supabase/server";
import {
  AIAbortError,
  AINetworkError,
  AIResponseError,
  AIValidationError,
} from "@/lib/ai/errors";
import { performance } from "perf_hooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestStart = performance.now();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để sử dụng tính năng này." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const mode =
      body?.mode === "passage" || body?.mode === "words"
        ? body.mode
        : "topic";
    const count =
      typeof body?.count === "number" && body.count > 0 && body.count <= 30
        ? body.count
        : 10;
    const level = typeof body?.level === "string" ? body.level : "B1-B2";
    const tone = typeof body?.tone === "string" ? body.tone : "general";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error:
            mode === "passage"
              ? "Vui lòng dán đoạn văn cần trích xuất từ vựng."
              : mode === "words"
              ? "Vui lòng nhập danh sách từ tiếng Anh cần tra."
              : "Vui lòng nhập chủ đề từ vựng cần tạo.",
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[AI Import] Request", {
        mode,
        count,
        level,
        promptLength: prompt.length,
      });
    }

    const result = await importVocabulary({
      prompt,
      mode,
      count,
      level,
      tone,
      signal: request.signal,
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[AI Import] Total request took",
        Math.round(performance.now() - requestStart),
        "ms"
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AI Import] Error:", error);
    }
    return NextResponse.json(
      { success: false, error: getFriendlyImportError(error) },
      { status: getStatusCode(error) }
    );
  }
}

function getStatusCode(error: unknown): number {
  if (error instanceof AIValidationError) return 422;
  if (error instanceof AIAbortError) return 408;
  if (error instanceof AINetworkError) return 503;
  if (error instanceof AIResponseError) return 502;
  return 500;
}

function getFriendlyImportError(error: unknown): string {
  if (error instanceof AIValidationError)
    return "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại với mô tả rõ ràng hơn.";
  if (error instanceof AIAbortError)
    return "Yêu cầu bị gián đoạn hoặc quá thời gian xử lý (timeout). Vui lòng thử lại với số lượng từ ít hơn.";
  if (error instanceof AINetworkError)
    return "Không thể kết nối tới dịch vụ AI. Vui lòng kiểm tra kết nối mạng và thử lại.";
  if (error instanceof AIResponseError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit"))
      return "Hệ thống AI đang quá tải lượt gọi. Vui lòng thử lại sau ít phút.";
    if (msg.includes("quota"))
      return "Hạn mức AI tạm thời hết. Vui lòng thử lại sau.";
    if (msg.includes("json"))
      return "AI trả về định dạng không hợp lệ. Vui lòng thử lại.";
    return error.message || "Không thể tạo danh sách từ vựng. Vui lòng thử lại.";
  }
  return "Không thể tạo danh sách từ vựng. Vui lòng thử lại.";
}
