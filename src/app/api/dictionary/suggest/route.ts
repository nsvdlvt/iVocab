import { NextRequest, NextResponse } from "next/server";
import { dictionaryService } from "@/lib/dictionary/dictionary.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    if (query.length > 50) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const suggestions = await dictionaryService.getSuggestions(query, request.signal);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi gợi ý từ.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
