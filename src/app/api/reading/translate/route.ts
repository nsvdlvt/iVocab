import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
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
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  for (const model of FALLBACK_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Bạn là dịch giả tiếng Anh - tiếng Việt chuyên nghiệp. Hãy dịch đoạn văn bản bài đọc sang tiếng Việt tự nhiên, chính xác, giữ nguyên ngữ cảnh học thuật và sắc thái nghĩa. Chỉ trả về kết quả dịch tiếng Việt, không kèm lời giải thích, không kèm markdown thừa.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: `Dịch đoạn văn bản tiếng Anh sau sang tiếng Việt:\n\n${text}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
        signal: signal ?? AbortSignal.timeout(12000),
      });

      if (!response.ok) continue;

      const data = (await response.json().catch(() => null)) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string; thought?: boolean }>;
          };
        }>;
      } | null;

      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const translated = parts
        .filter((part) => !part.thought && typeof part.text === "string")
        .map((part) => part.text)
        .join("")
        .trim();

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
