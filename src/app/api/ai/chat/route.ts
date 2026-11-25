// src/app/api/ai/chat/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCloudflareConfigured } from "@/lib/ai/cloudflare/config";
import {
  classifyChatError,
  validateChatMessages,
} from "@/lib/ai/chat/service";
import { runAgentConversation } from "@/lib/ai/agent/orchestrator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple sliding-window per-user rate limiter (20 requests / 60 seconds)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, number[]>();

function checkUserRateLimit(userId: string, now = Date.now()): boolean {
  const prev = rateBuckets.get(userId) ?? [];
  const active = prev.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (active.length >= RATE_MAX_REQUESTS) {
    rateBuckets.set(userId, active);
    return false;
  }
  active.push(now);
  rateBuckets.set(userId, active);
  return true;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate current user server-side (never trust client/model userId)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng đăng nhập để sử dụng Vocabee AI.",
        },
        { status: 401 }
      );
    }

    if (!checkUserRateLimit(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi ít giây rồi thử lại.",
        },
        { status: 429 }
      );
    }

    if (!isCloudflareConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Dịch vụ AI chưa được cấu hình trên máy chủ.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      messages?: unknown;
      stream?: unknown;
    } | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Payload JSON không hợp lệ." },
        { status: 400 }
      );
    }

    const validation = validateChatMessages(body.messages);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const wantsStream =
      body.stream !== false &&
      (body.stream === true ||
        request.headers.get("accept")?.includes("text/event-stream"));

    if (wantsStream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let closed = false;
          const safeEnqueue = (payload: string) => {
            if (closed || request.signal.aborted) return;
            try {
              controller.enqueue(encoder.encode(payload));
            } catch {
              closed = true;
            }
          };

          const sendEvent = (event: string, data: unknown) => {
            safeEnqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          };

          try {
            const result = await runAgentConversation(user.id, validation.messages, {
              signal: request.signal,
              onStatusChange: (status) => sendEvent("status", { status }),
              onToolEvent: (toolEvent) => sendEvent("tool_event", toolEvent),
              onConfirmations: (confirmations) =>
                sendEvent("confirmations", { confirmations }),
              onCards: (cards) => sendEvent("cards", { cards }),
              onTextDelta: (delta) => sendEvent("delta", { delta }),
            });

            if (!request.signal.aborted) {
              if (!result.success) {
                sendEvent("error", {
                  error: result.error || "Không thể nhận phản hồi từ Vocabee AI.",
                });
              } else {
                sendEvent("done", {
                  reply: result.reply,
                  toolEvents: result.toolEvents,
                  confirmations: result.confirmations,
                  cards: result.cards,
                  model: result.model,
                });
              }
            }
          } catch (err: unknown) {
            if (!request.signal.aborted) {
              const classified = classifyChatError(err);
              console.error("[api/ai/chat] Streaming error:", classified.message);
              sendEvent("error", { error: classified.message });
            }
          } finally {
            if (!closed) {
              closed = true;
              try {
                controller.close();
              } catch {
                // ignore already closed stream
              }
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await runAgentConversation(user.id, validation.messages, {
      signal: request.signal,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Không thể nhận phản hồi từ Vocabee AI.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      toolEvents: result.toolEvents,
      confirmations: result.confirmations,
      cards: result.cards,
      model: result.model,
    });
  } catch (error: unknown) {
    const classified = classifyChatError(error);
    console.error("[api/ai/chat] Request error:", classified.message);
    return NextResponse.json(
      { success: false, error: classified.message },
      { status: classified.status }
    );
  }
}
