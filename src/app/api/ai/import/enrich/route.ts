// src/app/api/ai/import/enrich/route.ts
import { NextResponse } from "next/server";
import { enrichVocabulary } from "@/lib/ai/import-vocabulary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { item, missingFields } = body;

    if (!item || !item.word || !missingFields || !Array.isArray(missingFields) || missingFields.length === 0) {
      return NextResponse.json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, { status: 400 });
    }

    const enriched = await enrichVocabulary(item, missingFields, request.signal);
    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    console.error("AI Enrich Route Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể bổ sung dữ liệu từ vựng.",
        details: message
      },
      { status: 500 }
    );
  }
}
