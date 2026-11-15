// src/lib/ai/agent/confirmation.ts
import crypto from "crypto";
import { DestructiveActionType } from "./types";

const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

function getSigningSecret(): string {
  return (
    process.env.SUPABASE_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    "vocabee_agent_confirmation_secret_2026"
  );
}

export interface ConfirmationPayload {
  action: DestructiveActionType;
  targetId: string;
  userId: string;
  timestamp: number;
}

export function generateConfirmationToken(
  action: DestructiveActionType,
  targetId: string,
  userId: string
): string {
  const timestamp = Date.now();
  const secret = getSigningSecret();
  const data = `${action}:${targetId}:${userId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  // Pack into a base64url string
  const rawPayload = JSON.stringify({ action, targetId, userId, timestamp, hmac });
  return Buffer.from(rawPayload, "utf8").toString("base64url");
}

export function verifyConfirmationToken(
  token: string,
  expectedAction: DestructiveActionType,
  expectedTargetId: string,
  currentUserId: string
): { valid: boolean; reason?: string } {
  try {
    const rawPayload = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(rawPayload) as {
      action: DestructiveActionType;
      targetId: string;
      userId: string;
      timestamp: number;
      hmac: string;
    };

    if (!parsed || typeof parsed !== "object") {
      return { valid: false, reason: "Token không hợp lệ." };
    }

    if (parsed.userId !== currentUserId) {
      return { valid: false, reason: "Token không thuộc về tài khoản hiện tại." };
    }

    if (parsed.action !== expectedAction) {
      return { valid: false, reason: "Thao tác không khớp với yêu cầu xác nhận." };
    }

    if (parsed.targetId !== expectedTargetId) {
      return { valid: false, reason: "Mục tiêu không khớp với yêu cầu xác nhận." };
    }

    const age = Date.now() - parsed.timestamp;
    if (age > TOKEN_EXPIRATION_MS || age < -60000) {
      return { valid: false, reason: "Yêu cầu xác nhận đã hết hạn (quá 15 phút). Vui lòng thử lại." };
    }

    const secret = getSigningSecret();
    const data = `${parsed.action}:${parsed.targetId}:${parsed.userId}:${parsed.timestamp}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(data).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(parsed.hmac, "hex"), Buffer.from(expectedHmac, "hex"))) {
      return { valid: true };
    }

    return { valid: false, reason: "Chữ ký bảo mật không khớp." };
  } catch (error) {
    return { valid: false, reason: "Không thể giải mã mã xác nhận." };
  }
}
