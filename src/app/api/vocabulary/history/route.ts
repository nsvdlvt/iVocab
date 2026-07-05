import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SentenceHistoryRepository } from "@/repositories/sentence-history.repository";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vocabId = searchParams.get("vocabId");

    if (!vocabId) {
      return NextResponse.json({ success: false, error: "vocabId is required" }, { status: 400 });
    }

    const history = await SentenceHistoryRepository.getByVocabularyId(user.id, vocabId);

    return NextResponse.json({ success: true, history });
  } catch (error: unknown) {
    console.error("Get history error:", error);
    const message = error instanceof Error ? error.message : "Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
