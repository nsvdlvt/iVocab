import { NextResponse } from "next/server";
import { importVocabulary } from "@/lib/ai/import-vocabulary";
import { createClient } from "@/lib/supabase/server";
import { AIAbortError, AINetworkError, AIResponseError, AIValidationError } from "@/lib/ai/errors";
import { extractTextFromImageInput } from "@/lib/ocr/extract-text";
import { performance } from "perf_hooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestStart = performance.now();
  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    let prompt = "";
    let imageFile: File | null = null;
    let imageBase64: string | undefined;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isMultipart) {
      const formData = await request.formData();
      prompt = (formData.get("prompt") as string) || "";
      imageFile = (formData.get("file") as File | null) ?? null;
    } else {
      const body = await request.json().catch(() => ({}));
      prompt = body.prompt || "";
      imageBase64 = body.image || undefined;
    }

    const hasImage = Boolean(imageFile || imageBase64);
    const imageSizeBytes = imageFile ? imageFile.size : imageBase64 ? Math.floor((imageBase64.length * 3) / 4) : 0;
    if (process.env.NODE_ENV === "development") {
      console.log("[AI Import] Request", {
        promptLength: prompt.length,
        imageExists: hasImage,
        imageSizeBytes,
      });
    }

    if (!prompt && !hasImage) {
      return NextResponse.json({ success: false, error: "Thiếu dữ liệu đầu vào." }, { status: 400 });
    }

    if (hasImage) {
      const extractedText = await extractTextFromImageInput(imageFile, imageBase64);

      const result = await importVocabulary(extractedText, undefined, request.signal);
      if (process.env.NODE_ENV === "development") {
        console.log("[AI Import] Total request", Math.round(performance.now() - requestStart), "ms");
      }
      return NextResponse.json({ success: true, data: result });
    }

    const result = await importVocabulary(prompt, undefined, request.signal);
    if (process.env.NODE_ENV === "development") {
      console.log("[AI Import] Total request", Math.round(performance.now() - requestStart), "ms");
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getFriendlyImportError(error) },
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

function getFriendlyImportError(error: unknown): string {
  if (error instanceof AIValidationError) return "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.";
  if (error instanceof AIAbortError) return "Yêu cầu bị gián đoạn hoặc quá thời gian. Vui lòng thử lại.";
  if (error instanceof AINetworkError) return "Không thể kết nối tới AI. Vui lòng kiểm tra mạng và thử lại.";
  if (error instanceof AIResponseError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("không thể nhận dạng văn bản trong ảnh")) return "Không thể nhận dạng văn bản trong ảnh.";
    if (msg.includes("rate limit")) return "Hệ thống AI đang bận. Vui lòng thử lại sau ít phút.";
    if (msg.includes("quota")) return "Hạn mức AI đã hết. Vui lòng thử lại sau.";
    if (msg.includes("json")) return "AI trả về định dạng không hợp lệ. Vui lòng thử lại.";
    return "Không thể tạo danh sách từ vựng. Vui lòng thử lại.";
  }
  return "Không thể tạo danh sách từ vựng. Vui lòng thử lại.";
}
