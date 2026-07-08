import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/repositories/review.repository";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const reviewItems = await ReviewRepository.getDueReviews(user.id);
    const words = reviewItems.map((item) => item.vocabulary);
    const session = ReviewSessionStore.create(words);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
