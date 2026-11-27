import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import {
  deduplicateSelectedVocabulary,
  MAX_WORDS_FOR_PERSONAL_TEST,
  MIN_WORDS_FOR_PERSONAL_TEST,
  suggestTestTitle,
} from "@/lib/personal-test/vocabulary-selection";
import { generatePersonalTestWithAI } from "@/lib/personal-test/ai-generator";
import { resolveFlashcardsForTestContent } from "@/lib/personal-test/flashcard-session";
import {
  acquireGenerationSlot,
  releaseGenerationSlot,
} from "@/lib/personal-test/rate-limit";
import {
  AIAbortError,
  AINetworkError,
  AIResponseError,
  AIValidationError,
} from "@/lib/ai/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GenerateRequestSchema = z.object({
  title: z.string().trim().max(140).optional(),
  vocabularyIds: z
    .array(z.string().trim().min(1))
    .min(MIN_WORDS_FOR_PERSONAL_TEST, {
      message: `Vui lòng chọn ít nhất ${MIN_WORDS_FOR_PERSONAL_TEST} từ vựng để tạo bài kiểm tra.`,
    })
    .max(100, {
      message: "Số lượng bản ghi từ vựng vượt quá giới hạn cho một lần tạo bài kiểm tra.",
    }),
});

export async function POST(request: Request) {
  let activeUserId: string | null = null;
  let slotAcquired = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Vui lòng đăng nhập để tiếp tục." },
        { status: 401 }
      );
    }

    activeUserId = user.id;

    const rawBody = await request.json().catch(() => null);
    const parsedBody = GenerateRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsedBody.error.issues[0]?.message ||
            "Dữ liệu yêu cầu tạo bài kiểm tra không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const uniqueRequestedIds = Array.from(new Set(parsedBody.data.vocabularyIds));
    if (uniqueRequestedIds.length < MIN_WORDS_FOR_PERSONAL_TEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Vui lòng chọn ít nhất ${MIN_WORDS_FOR_PERSONAL_TEST} từ vựng khác nhau.`,
        },
        { status: 400 }
      );
    }

    // Verify ownership of all selected vocabulary records & parent sets server-side
    const { words: verifiedRecords, unauthorizedIds } =
      await PersonalTestRepository.getVerifiedSelectedWordsForUser(
        user.id,
        uniqueRequestedIds
      );

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Một hoặc nhiều từ vựng được chọn không tồn tại hoặc không thuộc quyền sở hữu của bạn.",
        },
        { status: 403 }
      );
    }

    const deduplicatedWords = deduplicateSelectedVocabulary(verifiedRecords);

    if (deduplicatedWords.length < MIN_WORDS_FOR_PERSONAL_TEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Sau khi gộp các từ trùng lặp, chỉ còn ${deduplicatedWords.length} từ duy nhất. Cần ít nhất ${MIN_WORDS_FOR_PERSONAL_TEST} từ khác nhau để tạo bài kiểm tra.`,
        },
        { status: 400 }
      );
    }

    if (deduplicatedWords.length > MAX_WORDS_FOR_PERSONAL_TEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Tối đa ${MAX_WORDS_FOR_PERSONAL_TEST} từ duy nhất cho mỗi bài kiểm tra (hiện đã chọn ${deduplicatedWords.length} từ). Vui lòng giảm bớt số lượng từ.`,
        },
        { status: 400 }
      );
    }

    const slot = acquireGenerationSlot(user.id);
    if (!slot.allowed) {
      return NextResponse.json(
        { success: false, error: slot.reason },
        {
          status: 429,
          headers: slot.retryAfterSeconds
            ? { "Retry-After": String(slot.retryAfterSeconds) }
            : undefined,
        }
      );
    }
    slotAcquired = true;

    const uniqueSetsMap = new Map<string, string>();
    for (const rec of verifiedRecords) {
      if (!uniqueSetsMap.has(rec.set_id)) {
        uniqueSetsMap.set(rec.set_id, rec.set_title);
      }
    }
    const sourceSets = Array.from(uniqueSetsMap.entries()).map(([id, title]) => ({
      id,
      title,
    }));

    const resolvedTitle =
      parsedBody.data.title && parsedBody.data.title.trim().length > 0
        ? parsedBody.data.title.trim()
        : suggestTestTitle(sourceSets, deduplicatedWords.length);

    const generatedTest = await generatePersonalTestWithAI({
      title: resolvedTitle,
      targetWords: deduplicatedWords,
      signal: request.signal,
    });

    const created = await PersonalTestRepository.createPersonalTest(
      user.id,
      generatedTest
    );

    if (!created) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể lưu bài kiểm tra vào cơ sở dữ liệu. Vui lòng thử lại.",
        },
        { status: 500 }
      );
    }

    const flashcards = resolveFlashcardsForTestContent(
      generatedTest,
      verifiedRecords,
      verifiedRecords.map((r) => r.id)
    );

    revalidatePath("/u/personal-test");
    revalidatePath("/personal-test");

    return NextResponse.json({
      success: true,
      testId: created.id,
      test: generatedTest,
      metadata: {
        sourceVocabularyIds: verifiedRecords.map((r) => r.id),
        sourceSetIds: sourceSets.map((s) => s.id),
        uniqueTargetWordsCount: deduplicatedWords.length,
        flashcards,
      },
    });
  } catch (error) {
    console.error("[API personal-test/generate] Error:", error);

    if (error instanceof AIValidationError) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            "AI chưa thể tạo bài kiểm tra đạt chuẩn kiểm duyệt. Vui lòng thử lại hoặc điều chỉnh danh sách từ.",
        },
        { status: 422 }
      );
    }

    if (error instanceof AIAbortError) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu tạo bài kiểm tra đã bị hủy hoặc quá thời gian." },
        { status: 408 }
      );
    }

    if (error instanceof AINetworkError) {
      return NextResponse.json(
        { success: false, error: "Không thể kết nối tới dịch vụ AI. Vui lòng thử lại." },
        { status: 503 }
      );
    }

    if (error instanceof AIResponseError) {
      return NextResponse.json(
        { success: false, error: error.message || "Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi khi tạo bài kiểm tra. Vui lòng thử lại." },
      { status: 500 }
    );
  } finally {
    if (slotAcquired && activeUserId) {
      releaseGenerationSlot(activeUserId);
    }
  }
}
