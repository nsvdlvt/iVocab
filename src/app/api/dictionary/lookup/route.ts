import { NextRequest, NextResponse } from "next/server";
import { dictionaryService } from "@/lib/dictionary/dictionary.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const pos = searchParams.get("pos")?.trim() || undefined;
    const sentence = searchParams.get("sentence")?.trim() || undefined;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp từ hoặc cụm từ cần tra cứu." },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { success: false, error: "Từ tra cứu quá dài (tối đa 100 ký tự)." },
        { status: 400 }
      );
    }

    const result = await dictionaryService.lookup(query, {
      pos,
      contextSentence: sentence,
      signal: request.signal,
    });

    if (!result) {
      // Also fetch suggestions to help the user if word not found
      const suggestions = await dictionaryService.getSuggestions(query, request.signal);
      return NextResponse.json(
        {
          success: false,
          error: `Không tìm thấy từ "${query}" trong từ điển.`,
          suggestions,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi tra cứu từ điển.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
