import { NextRequest, NextResponse } from "next/server";
import { dictionaryService } from "@/lib/dictionary/dictionary.service";
import { ContextualTranslationRequestSchema } from "@/types/dictionary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = ContextualTranslationRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ. Vui lòng cung cấp cả từ vựng và câu ngữ cảnh.",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { word, sentence } = parsed.data;

    const result = await dictionaryService.translateContext(word, sentence, request.signal);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi dịch theo ngữ cảnh.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
