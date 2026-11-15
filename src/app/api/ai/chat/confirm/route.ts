// src/app/api/ai/chat/confirm/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyConfirmationToken } from "@/lib/ai/agent/confirmation";
import { executeConfirmedAction } from "@/lib/ai/agent/executor";
import { DestructiveActionType } from "@/lib/ai/agent/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Verify user session on server
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

    const body = (await request.json().catch(() => null)) as {
      token?: string;
      action?: DestructiveActionType;
      targetId?: string;
    } | null;

    if (!body?.token || !body?.action || !body?.targetId) {
      return NextResponse.json(
        { success: false, error: "Thiếu dữ liệu xác nhận thao tác." },
        { status: 400 }
      );
    }

    // 2. Validate cryptographic confirmation token
    const tokenCheck = verifyConfirmationToken(
      body.token,
      body.action,
      body.targetId,
      user.id
    );

    if (!tokenCheck.valid) {
      return NextResponse.json(
        { success: false, error: tokenCheck.reason || "Mã xác nhận không hợp lệ hoặc đã hết hạn." },
        { status: 403 }
      );
    }

    // 3. Execute confirmed database action
    const result = await executeConfirmedAction(user.id, body.action, body.targetId);

    return NextResponse.json({
      success: true,
      message: result.message,
      action: body.action,
      targetId: body.targetId,
    });
  } catch (error: unknown) {
    console.error("[api/ai/chat/confirm] Error executing confirmed action:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: `Không thể thực hiện thao tác: ${msg}`,
      },
      { status: 500 }
    );
  }
}
