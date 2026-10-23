import { NextRequest, NextResponse } from "next/server";
import { TranslationRequestSchema } from "@/types/translation";
import { learningTranslationService } from "@/lib/translation/learning-translation.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = TranslationRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Dữ liệu dịch không hợp lệ.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang, includeLearningAnalysis } = parsed.data;

    const result = await learningTranslationService.translate(
      text,
      sourceLang,
      targetLang,
      includeLearningAnalysis,
      request.signal
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[api/learning/translate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Đã xảy ra lỗi khi dịch văn bản.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
