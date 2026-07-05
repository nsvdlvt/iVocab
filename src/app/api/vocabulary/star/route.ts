import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { vocabularyId, isStarred } = await request.json();

    if (!vocabularyId) {
      return NextResponse.json({ success: false, error: "Vocabulary ID is required" }, { status: 400 });
    }

    await VocabularyRepository.updateStarStatus(vocabularyId, user.id, !!isStarred);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Star update error:", error);
    const message = error instanceof Error ? error.message : "Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
