// src/app/api/ai/chat/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgentConversation } from "@/lib/ai/agent/orchestrator";
import { AgentChatMessage } from "@/lib/ai/agent/types";
import { sanitizeErrorMessage } from "@/lib/ai/openrouter/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_COUNT = 30;

export async function POST(request: Request) {
  try {
    // 1. Verify authenticated user identity server-side
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng đăng nhập để sử dụng Vocabee AI Assistant.",
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = (await request.json().catch(() => null)) as {
      messages?: Array<{ role: string; content: string }>;
      message?: string;
      stream?: boolean;
    } | null;

    const wantsStream =
      body?.stream === true ||
      request.headers.get("accept")?.includes("text/event-stream");

    const rawMessages: AgentChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
          .slice(-MAX_MESSAGES_COUNT)
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              Boolean(
                m &&
                  (m.role === "user" || m.role === "assistant") &&
                  typeof m.content === "string" &&
                  m.content.trim().length > 0
              )
          )
          .map((m) => ({
            role: m.role,
            content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH),
          }))
      : typeof body?.message === "string" && body.message.trim().length > 0
      ? [{ role: "user", content: body.message.trim().slice(0, MAX_MESSAGE_LENGTH) }]
      : [];

    if (rawMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập nội dung câu hỏi." },
        { status: 400 }
      );
    }

    // 3. Handle Streaming Response (Server-Sent Events)
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            const agentResult = await runAgentConversation(user.id, rawMessages, {
              signal: request.signal,
              onStatusChange: (status) => {
                sendEvent("status", { status });
              },
              onToolEvent: (toolEvent) => {
                sendEvent("tool_event", toolEvent);
              },
              onTextDelta: (delta) => {
                sendEvent("text_delta", { delta });
              },
            });

            if (!agentResult.success) {
              sendEvent("error", {
                success: false,
                error: agentResult.error || "Không thể nhận phản hồi từ AI.",
                reply: agentResult.reply,
              });
            } else {
              sendEvent("done", {
                success: true,
                reply: agentResult.reply,
                toolEvents: agentResult.toolEvents || [],
                confirmation: agentResult.confirmation || null,
                model: agentResult.model,
              });
            }
          } catch (err: unknown) {
            console.error("[api/ai/chat] Streaming error:", err);
            sendEvent("error", {
              success: false,
              error: `Lỗi hệ thống: ${sanitizeErrorMessage(err)}`,
            });
          } finally {
            controller.close();
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

    // 4. Handle Standard JSON Response
    const agentResult = await runAgentConversation(user.id, rawMessages, {
      signal: request.signal,
    });

    if (!agentResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: agentResult.error || "Không thể nhận phản hồi từ AI.",
          reply: agentResult.reply,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: agentResult.reply,
      toolEvents: agentResult.toolEvents || [],
      confirmation: agentResult.confirmation || null,
      model: agentResult.model,
    });
  } catch (error: unknown) {
    console.error("[api/ai/chat] Fatal error in agent endpoint:", error);
    const msg = sanitizeErrorMessage(error);
    return NextResponse.json(
      {
        success: false,
        error: `Đã xảy ra lỗi hệ thống: ${msg}`,
      },
      { status: 500 }
    );
  }
}
