import { NextResponse } from "next/server";
import { enrichVocabulary } from "@/lib/ai/import-vocabulary";
import { createClient } from "@/lib/supabase/server";
import { AIAbortError, AINetworkError, AIResponseError, AIValidationError } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { item, missingFields } = body;

    if (!item || !item.word || !missingFields || !Array.isArray(missingFields) || missingFields.length === 0) {
      return NextResponse.json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, { status: 400 });
    }

    const enriched = await enrichVocabulary(item, missingFields, request.signal);
    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getFriendlyEnrichError(error) },
      { status: getStatusCode(error) }
    );
  }
}

function getStatusCode(error: unknown): number {
  if (error instanceof AIValidationError) return 422;
  if (error instanceof AIAbortError) return 408;
  if (error instanceof AINetworkError) return 503;
  if (error instanceof AIResponseError) return 502;
  return 500;
}

function getFriendlyEnrichError(error: unknown): string {
  if (error instanceof AIValidationError) return "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.";
  if (error instanceof AIAbortError) return "Yêu cầu bị gián đoạn hoặc quá thời gian. Vui lòng thử lại.";
  if (error instanceof AINetworkError) return "Không thể kết nối tới AI. Vui lòng kiểm tra mạng và thử lại.";
  if (error instanceof AIResponseError) return "Không thể làm giàu dữ liệu từ vựng. Vui lòng thử lại.";
  return "Không thể làm giàu dữ liệu từ vựng. Vui lòng thử lại.";
}
