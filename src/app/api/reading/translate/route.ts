import { NextResponse } from "next/server";
import { getAiApiKey, getAiBaseUrl } from "@/lib/ai/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FALLBACK_MODELS = [
  "gpt-5.6-luna",
  "gpt-6-luna",
  "gpt-5.6-terra",
  "gpt-6-sol",
  "gpt-6.1-sol",
];

async function translateWithGoogleGtx(text: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const translation = (data[0] as unknown[])
      .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
      .join("")
      .trim();

    return translation || null;
  } catch {
    return null;
  }
}

async function translateWithGemini(text: string, signal?: AbortSignal): Promise<string | null> {
  const apiKey = getAiApiKey();
  const baseURL = getAiBaseUrl();
  if (!apiKey) return null;

  for (const model of FALLBACK_MODELS) {
    try {
      const endpoint = `${baseURL}/chat/completions`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Bạn là dịch giả tiếng Anh - tiếng Việt chuyên nghiệp. Hãy dịch đoạn văn bản bài đọc sang tiếng Việt tự nhiên, chính xác, giữ nguyên ngữ cảnh học thuật và sắc thái nghĩa. Chỉ trả về kết quả dịch tiếng Việt, không kèm lời giải thích, không kèm markdown thừa.",
            },
            {
              role: "user",
              content: `Dịch đoạn văn bản tiếng Anh sau sang tiếng Việt:\n\n${text}`,
            },
          ],
          temperature: 0.3,
        }),
        signal: signal ?? AbortSignal.timeout(12000),
      });

      if (!response.ok) continue;

      const data = (await response.json().catch(() => null)) as {
        choices?: Array<{ message?: { content?: string } }>;
      } | null;

      const translated = data?.choices?.[0]?.message?.content?.trim();
      if (translated) return translated;
    } catch {
      continue;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp văn bản cần dịch." },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Đoạn văn quá dài (tối đa 5000 ký tự)." },
        { status: 400 }
      );
    }

    // Try Google GTX first for speed
    let translation = await translateWithGoogleGtx(text, request.signal);
    let provider = "google";

    // Fallback to Gemini AI if GTX fails or returns empty
    if (!translation) {
      translation = await translateWithGemini(text, request.signal);
      provider = "gemini";
    }

    if (!translation) {
      return NextResponse.json(
        { error: "Không thể dịch đoạn văn bản này vào lúc này. Vui lòng bấm thử lại." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      translation,
      provider,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
