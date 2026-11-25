// src/lib/ai/agent/confirmation.ts
import crypto from "crypto";
import { nanoid } from "nanoid";
import type { AgentActionType, PendingConfirmation } from "./types";

const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

// Track single-use action IDs consumed or cancelled in memory during this server lifecycle.
// Combined with cryptographic HMAC verification + ownership revalidation before execution.
const consumedActionIds = new Map<string, number>();

function cleanupExpiredConsumedIds(now = Date.now()) {
  if (consumedActionIds.size <= 500) return;
  for (const [id, exp] of consumedActionIds.entries()) {
    if (exp < now) {
      consumedActionIds.delete(id);
    }
  }
}

function getSigningSecret(): string {
  const secret =
    process.env.AI_CONFIRMATION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    process.env.CLOUDFLARE_API_TOKEN;

  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  return "vocabee_ephemeral_dev_confirmation_secret_v2";
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

function computeParamsDigest(action: AgentActionType, params: unknown): string {
  return crypto
    .createHash("sha256")
    .update(`${action}:${stableStringify(params)}`)
    .digest("hex");
}

export interface SealedTokenPayload {
  actionId: string;
  action: AgentActionType;
  userId: string;
  params: Record<string, unknown>;
  paramsHash: string;
  issuedAt: number;
  expiresAt: number;
  hmac: string;
}

export function createPendingConfirmation(input: {
  userId: string;
  action: AgentActionType;
  title: string;
  description: string;
  targetName: string;
  affectedCount: number;
  affectedSummary: string;
  consequences: string[];
  previewItems?: Array<{ label: string; detail?: string }>;
  params: Record<string, unknown>;
  nowMs?: number;
}): PendingConfirmation {
  const now = input.nowMs ?? Date.now();
  const actionId = `act_${nanoid(14)}`;
  const expiresAt = now + TOKEN_EXPIRATION_MS;
  const paramsHash = computeParamsDigest(input.action, input.params);

  const signatureBase = `${actionId}:${input.action}:${input.userId}:${paramsHash}:${now}:${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(signatureBase)
    .digest("hex");

  const payload: SealedTokenPayload = {
    actionId,
    action: input.action,
    userId: input.userId,
    params: input.params,
    paramsHash,
    issuedAt: now,
    expiresAt,
    hmac,
  };

  const token = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return {
    actionId,
    action: input.action,
    title: input.title,
    description: input.description,
    targetName: input.targetName,
    affectedCount: input.affectedCount,
    affectedSummary: input.affectedSummary,
    consequences: input.consequences,
    previewItems: input.previewItems,
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    status: "pending",
  };
}

export function verifyConfirmationToken(
  token: string,
  expectedAction: AgentActionType,
  expectedActionId: string,
  currentUserId: string,
  nowMs = Date.now()
):
  | { valid: true; payload: SealedTokenPayload }
  | { valid: false; reason: string; expired?: boolean } {
  try {
    if (!token || typeof token !== "string") {
      return { valid: false, reason: "Thiếu mã xác nhận thao tác." };
    }

    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as SealedTokenPayload;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.actionId !== "string" ||
      typeof parsed.action !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.paramsHash !== "string" ||
      typeof parsed.hmac !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return { valid: false, reason: "Mã xác nhận không đúng định dạng." };
    }

    if (parsed.userId !== currentUserId) {
      return { valid: false, reason: "Mã xác nhận không thuộc về tài khoản hiện tại." };
    }

    if (parsed.action !== expectedAction || parsed.actionId !== expectedActionId) {
      return { valid: false, reason: "Thao tác xác nhận không khớp với yêu cầu ban đầu." };
    }

    const expectedDigest = computeParamsDigest(parsed.action, parsed.params);
    if (expectedDigest !== parsed.paramsHash) {
      return { valid: false, reason: "Tham số thao tác đã bị thay đổi." };
    }

    if (nowMs > parsed.expiresAt) {
      return {
        valid: false,
        expired: true,
        reason: "Yêu cầu xác nhận đã hết hạn (quá 15 phút). Vui lòng tạo lại yêu cầu.",
      };
    }

    const signatureBase = `${parsed.actionId}:${parsed.action}:${parsed.userId}:${parsed.paramsHash}:${parsed.issuedAt}:${parsed.expiresAt}`;
    const expectedHmac = crypto
      .createHmac("sha256", getSigningSecret())
      .update(signatureBase)
      .digest("hex");

    const providedBuf = Buffer.from(parsed.hmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return { valid: false, reason: "Chữ ký xác thực không hợp lệ." };
    }

    if (consumedActionIds.has(parsed.actionId)) {
      return { valid: false, reason: "Thao tác này đã được xử lý hoặc đã bị hủy trước đó." };
    }

    return { valid: true, payload: parsed };
  } catch {
    return { valid: false, reason: "Không thể giải mã mã xác nhận." };
  }
}

export function markConfirmationConsumed(actionId: string, expiresAtMs: number): void {
  cleanupExpiredConsumedIds();
  consumedActionIds.set(actionId, expiresAtMs);
}

export function resetConsumedConfirmationsForTest(): void {
  consumedActionIds.clear();
}
