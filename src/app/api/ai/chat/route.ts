import { NextResponse } from "next/server";
import { DEFAULT_AI_MODELS, AI_MODEL, getAiApiKey, getAiBaseUrl } from "@/lib/ai/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  error?: {
    code?: number | string;
    message?: string;
  };
}

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý học tập AI thông minh của ứng dụng học từ vựng tiếng Anh iVocab.
Nhiệm vụ của bạn:
- Giải thích nghĩa từ vựng tiếng Anh, phiên âm (IPA), từ loại (Part of Speech) và sắc thái sử dụng.
- Đặt câu ví dụ tự nhiên kèm bản dịch tiếng Việt dễ hiểu.
- Phân biệt các từ đồng nghĩa, gần nghĩa hoặc dễ nhầm lẫn (ví dụ: affect vs effect).
- Hỗ trợ kiểm tra ngữ pháp, sửa câu và gợi ý cách diễn đạt tự nhiên hơn.
- Trả lời ngắn gọn, rõ ràng, thân thiện, trình bày dễ đọc bằng tiếng Việt (kèm ví dụ tiếng Anh).`;

export async function POST(request: Request) {
  try {
    const apiKey = getAiApiKey();
    const baseURL = getAiBaseUrl();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu cấu hình OPENAI_API_KEY trong .env.local",
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

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...rawMessages.slice(-20).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    let configuredModel = process.env.AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || AI_MODEL;
    if (configuredModel.startsWith("gemini-")) {
      configuredModel = "gpt-6-luna";
    }

    const modelsToTry = [
      configuredModel,
      ...DEFAULT_AI_MODELS.filter((m) => m !== configuredModel),
    ];

    let lastErrorMessage = "Không thể kết nối tới AI API.";
    let lastStatus = 502;

    for (const model of modelsToTry) {
      const endpoint = `${baseURL}/chat/completions`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
        signal: request.signal,
      });

      const data = (await response.json().catch(() => null)) as OpenAIChatResponse | null;

      if (!response.ok) {
        lastStatus = response.status;
        lastErrorMessage =
          data?.error?.message || `AI API trả về lỗi (${response.status}).`;

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

      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        lastErrorMessage = "AI không trả về nội dung phản hồi.";
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
            : "Đã xảy ra lỗi khi kết nối với AI.",
      },
      { status: 500 }
    );
  }
}
