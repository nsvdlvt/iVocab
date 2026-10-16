import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

const DEFAULT_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý học tập AI thông minh của ứng dụng học từ vựng tiếng Anh iVocab.
Nhiệm vụ của bạn:
- Giải thích nghĩa từ vựng tiếng Anh, phiên âm (IPA), từ loại (Part of Speech) và sắc thái sử dụng.
- Đặt câu ví dụ tự nhiên kèm bản dịch tiếng Việt dễ hiểu.
- Phân biệt các từ đồng nghĩa, gần nghĩa hoặc dễ nhầm lẫn (ví dụ: affect vs effect).
- Hỗ trợ kiểm tra ngữ pháp, sửa câu và gợi ý cách diễn đạt tự nhiên hơn.
- Trả lời ngắn gọn, rõ ràng, thân thiện, trình bày dễ đọc bằng tiếng Việt (kèm ví dụ tiếng Anh).`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu cấu hình GEMINI_API_KEY trong .env.local",
        },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      messages?: ChatHistoryItem[];
      message?: string;
    } | null;

    const rawMessages: ChatHistoryItem[] = Array.isArray(body?.messages)
      ? body.messages.filter(
          (m): m is ChatHistoryItem =>
            Boolean(
              m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string" &&
                m.content.trim().length > 0
            )
        )
      : typeof body?.message === "string" && body.message.trim().length > 0
        ? [{ role: "user", content: body.message.trim() }]
        : [];

    if (rawMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập nội dung câu hỏi." },
        { status: 400 }
      );
    }

    const contents = rawMessages.slice(-20).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const modelsToTry = configuredModel
      ? [
          configuredModel,
          ...DEFAULT_GEMINI_MODELS.filter((m) => m !== configuredModel),
        ]
      : DEFAULT_GEMINI_MODELS;

    let lastErrorMessage = "Không thể kết nối tới Gemini API.";
    let lastStatus = 502;

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),
        signal: request.signal,
      });

      const data = (await response.json().catch(() => null)) as GeminiResponse | null;

      if (!response.ok) {
        lastStatus = response.status;
        lastErrorMessage =
          data?.error?.message || `Gemini API trả về lỗi (${response.status}).`;

        // Retry with fallback model on overloaded / unavailable / not found / rate-limited model
        if (
          response.status === 404 ||
          response.status === 429 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          continue;
        }

        break;
      }

      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const reply = parts
        .filter((part) => !part.thought && typeof part.text === "string")
        .map((part) => part.text)
        .join("")
        .trim();

      if (!reply) {
        lastErrorMessage = "Gemini không trả về nội dung phản hồi.";
        continue;
      }

      return NextResponse.json({
        success: true,
        reply,
        model,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: lastErrorMessage,
      },
      { status: lastStatus >= 400 && lastStatus < 600 ? lastStatus : 502 }
    );
  } catch (error: unknown) {
    console.error("[AI Chat API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối với Gemini AI.",
      },
      { status: 500 }
    );
  }
}
