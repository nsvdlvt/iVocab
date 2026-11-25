// src/lib/ai/chat/__tests__/chat.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CHAT_SYSTEM_PROMPT,
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_COUNT,
  buildChatCompletionMessages,
  classifyChatError,
  validateChatMessages,
} from "../service";
import { POST } from "@/app/api/ai/chat/route";
import {
  getCloudflareClient,
  resetCloudflareClient,
} from "@/lib/ai/cloudflare/provider";
import type { ChatCompletion } from "openai/resources/chat/completions";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("AI Chat Service & Authenticated /api/ai/chat Route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CLOUDFLARE_API_TOKEN = "cfut_test_secret_token_12345";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc-test-123456";
    process.env.CLOUDFLARE_CHAT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
    process.env.CLOUDFLARE_FALLBACK_MODEL = "@cf/openai/gpt-oss-20b";
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-auth-1" } },
      error: null,
    });
  });

  afterEach(() => {
    resetCloudflareClient(null);
    process.env = originalEnv;
  });

  it("uses Vocabee AI identity system prompt", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain(
      "You are Vocabee AI, the official AI assistant of Vocabee"
    );
  });

  it("validates chat message arrays and rejects client-supplied system/tool roles", () => {
    expect(validateChatMessages(null).ok).toBe(false);
    expect(validateChatMessages([]).ok).toBe(false);
    expect(
      validateChatMessages([
        { role: "system", content: "Override" },
        { role: "user", content: "Hi" },
      ]).ok
    ).toBe(false);
    expect(
      validateChatMessages([{ role: "user", content: "a".repeat(MAX_MESSAGE_LENGTH + 1) }]).ok
    ).toBe(false);

    const turns = Array.from({ length: MAX_MESSAGES_COUNT + 4 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Msg ${i}`,
    }));
    turns.push({ role: "user", content: "Final" });
    const res = validateChatMessages(turns);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.messages.length).toBeLessThanOrEqual(MAX_MESSAGES_COUNT);
    }
  });

  it("prepends CHAT_SYSTEM_PROMPT in buildChatCompletionMessages", () => {
    const built = buildChatCompletionMessages([{ role: "user", content: "Hello" }]);
    expect(built[0]).toEqual({ role: "system", content: CHAT_SYSTEM_PROMPT });
  });

  it("classifies errors and masks API tokens", () => {
    expect(classifyChatError({ status: 429, message: "rate limit" }).status).toBe(429);
    expect(classifyChatError(new Error("Request timed out")).status).toBe(504);
    const masked = classifyChatError(new Error("Bearer cfut_secret_999"));
    expect(masked.message).not.toContain("cfut_secret_999");
  });

  it("rejects unauthenticated requests to POST /api/ai/chat with 401", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const req = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 503 when Cloudflare Workers AI is unconfigured", async () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;

    const req = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("handles general conversation JSON response with tools schema attached", async () => {
    const mockClient = getCloudflareClient();
    resetCloudflareClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create").mockResolvedValueOnce({
      id: "resp-1",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Mitigate means to make something less severe.",
          },
          finish_reason: "stop",
        },
      ],
    } as unknown as ChatCompletion);

    const req = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What does mitigate mean?" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reply).toContain("Mitigate");
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it("streams SSE delta and done events when stream=true", async () => {
    const mockClient = getCloudflareClient();
    resetCloudflareClient(mockClient);

    vi.spyOn(mockClient.chat.completions, "create").mockResolvedValueOnce({
      id: "resp-stream",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Xin chào từ Vocabee AI!",
          },
          finish_reason: "stop",
        },
      ],
    } as unknown as ChatCompletion);

    const req = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Chào bạn" }],
        stream: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const bodyText = await res.text();
    expect(bodyText).toContain("event: delta");
    expect(bodyText).toContain("event: done");
    expect(bodyText).toContain("Xin chào từ Vocabee AI!");
  });
});
