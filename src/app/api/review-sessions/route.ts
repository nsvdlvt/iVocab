import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/repositories/review.repository";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";
import { ReviewSessionSchemaError } from "@/lib/review-session/review-session-schema";

type ApiErrorPayload = {
  success: false;
  error: string;
  details: string | null;
  code: string | null;
  operation: string;
};

function toApiError(operation: string, error: unknown): ApiErrorPayload {
  if (error instanceof ReviewSessionSchemaError) {
    return {
      success: false,
      error: error.message,
      details: null,
      code: error.code,
      operation,
    };
  }

  const typed = error instanceof Error ? error : new Error("Server Error");
  return {
    success: false,
    error: typed.message,
    details: null,
    code: (typed as Error & { code?: string | null }).code ?? null,
    operation,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  return { user, authError };
}

export async function GET(request: Request) {
  try {
    const { user, authError } = await requireUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: authError?.message ?? "Unauthorized",
          details: null,
          code: (authError as Error & { code?: string | null } | null)?.code ?? null,
          operation: "getUser",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const vocabularySetId = url.searchParams.get("vocabularySetId");
    if (!vocabularySetId) {
      return NextResponse.json(
        { success: false, error: "Missing vocabularySetId", details: null, code: null, operation: "GET" },
        { status: 400 }
      );
    }

    const preview = await ReviewRepository.getSetReviewPreview(user.id, vocabularySetId);

    const response = {
      success: true,
      stats: {
        overdueCount: preview.overdueCount,
        dueTodayCount: preview.dueTodayCount,
        reviewNowCount: preview.reviewNowCount,
        dueSoonCount: preview.dueSoonCount,
        dueSoonDays: preview.dueSoonDays,
        notLearnedCount: preview.notLearnedCount,
        learnedCount: preview.learnedCount,
        totalCount: preview.totalCount,
        levelDistribution: preview.levelDistribution,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[review-sessions:get]", error instanceof Error ? error.message : error);
    return NextResponse.json(toApiError("GET /api/review-sessions", error), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, authError } = await requireUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: authError?.message ?? "Unauthorized",
          details: null,
          code: (authError as Error & { code?: string | null } | null)?.code ?? null,
          operation: "getUser",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { vocabularySetId?: string | null };
    const vocabularySetId = typeof body.vocabularySetId === "string" && body.vocabularySetId ? body.vocabularySetId : null;

    const reviewItems = vocabularySetId
      ? await ReviewRepository.getDueReviewsBySetId(user.id, vocabularySetId)
      : await ReviewRepository.getDueReviews(user.id);
    const words = reviewItems.map((item) => item.vocabulary);
    const session = await ReviewSessionStore.create(user.id, words, {
      vocabularySetId,
      title: vocabularySetId ? "Ôn tập bộ từ vựng" : "Ôn tập hôm nay",
      description: vocabularySetId
        ? "Chỉ những từ trong bộ từ vựng này sẽ được đưa vào phiên ôn."
        : "Các từ được lên lịch để ôn hôm nay",
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
      },
    });
  } catch (error: unknown) {
    console.error("[review-sessions]", error instanceof Error ? error.message : error);
    return NextResponse.json(toApiError("POST /api/review-sessions", error), { status: 500 });
  }
}
