// src/app/api/ai/chat/confirm/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  cancelPendingAgentAction,
  executeConfirmedAgentAction,
} from "@/lib/ai/agent/executor";
import type { AgentActionType } from "@/lib/ai/agent/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const confirmRequestSchema = z.object({
  token: z.string().min(10),
  actionId: z.string().min(4),
  action: z.enum([
    "create_vocabulary_set",
    "update_vocabulary_set",
    "delete_vocabulary_set",
    "create_vocabulary_word",
    "update_vocabulary_word",
    "delete_vocabulary_word",
    "bulk_create_vocabulary_words",
    "bulk_update_vocabulary_words",
    "save_personal_test",
  ]),
  decision: z.enum(["confirm", "cancel"]).default("confirm"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = confirmRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu xác nhận không hợp lệ." },
        { status: 400 }
      );
    }

    const { token, actionId, action, decision } = parsed.data;

    if (decision === "cancel") {
      const cancelResult = await cancelPendingAgentAction(user.id, {
        token,
        actionId,
        action: action as AgentActionType,
      });
      return NextResponse.json(cancelResult);
    }

    const result = await executeConfirmedAgentAction(user.id, {
      token,
      actionId,
      action: action as AgentActionType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: result.statusCode ?? 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      action: result.action,
      actionId: result.actionId,
      affectedCount: result.affectedCount,
      targetIds: result.targetIds,
      actionUrl: result.actionUrl,
    });
  } catch (error: unknown) {
    console.error("[api/ai/chat/confirm] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể xử lý yêu cầu xác nhận. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
