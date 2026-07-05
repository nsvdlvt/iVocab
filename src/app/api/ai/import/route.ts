// src/app/api/ai/import/route.ts
import { NextResponse } from "next/server";
import { importVocabulary } from "@/lib/ai/import-vocabulary";
import { createClient } from "@/lib/supabase/server";
import { AI_MODEL } from "@/lib/ai/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/import
 * Handles both JSON and multipart/form-data requests for vocabulary import.
 * Includes extensive logging for debugging server‑side failures.
 */
export async function POST(request: Request) {
  // [1] Route entered
  console.log("[1] Route entered");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[2] Unauthorized access attempt");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Determine request type
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    console.log(`[2] Request parsed – type: ${isMultipart ? "multipart" : "json"}`);

    let prompt = "";
    let imageBase64: string | undefined = undefined;
    let imageSizeBytes = 0;

    // [3] Parse request payload
    if (isMultipart) {
      const formData = await request.formData();
      prompt = (formData.get("prompt") as string) || "";
      const file = formData.get("file") as File | null;
      if (file) {
        const buffer = await file.arrayBuffer();
        const mimeType = file.type || "image/jpeg";
        const base64String = Buffer.from(buffer).toString("base64");
        imageBase64 = `data:${mimeType};base64,${base64String}`;
        imageSizeBytes = Buffer.byteLength(base64String, "base64");
      }
    } else {
      const body = await request.json();
      prompt = body.prompt || "";
      imageBase64 = body.image || undefined;
      if (imageBase64) {
        const [, base64Part] = imageBase64.split(",");
        if (base64Part) imageSizeBytes = Buffer.byteLength(base64Part, "base64");
      }
    }

    // Basic validation
    if (!prompt && !imageBase64) {
      console.warn("[4] Missing input data");
      return NextResponse.json({ success: false, error: "Thiếu dữ liệu đầu vào." }, { status: 400 });
    }

    // Log diagnostics before calling AI
    const payloadType = imageBase64 ? "multimodal" : "text";
    const promptLength = prompt.length;
    const requestBodySize = Buffer.byteLength(JSON.stringify({ prompt, image: imageBase64 }), "utf8");
    console.log(`[3] Prompt built – length: ${promptLength}`);
    console.log(`[4] Payload built – type: ${payloadType}, image exists: ${!!imageBase64}, image size (bytes): ${imageSizeBytes}`);
    console.log(`[5] Model: ${AI_MODEL}, Endpoint: ${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/responses`);
    console.log(`[6] Request body size (including Base64): ${requestBodySize} bytes`);

    // Call the AI client
    const result = await importVocabulary(prompt, imageBase64, request.signal);
    console.log("[7] Response received");
    console.log("[8] Validation passed");
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    // Capture full stack trace
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("AI Import Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo danh sách từ vựng. Vui lòng thử lại.",
        details: errMessage,
        stack: process.env.NODE_ENV === "development" ? errStack : undefined,
      },
      { status: 500 }
    );
  }
}
