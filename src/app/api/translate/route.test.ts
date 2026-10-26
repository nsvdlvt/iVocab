import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/translate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when text is empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Vui lòng cung cấp văn bản");
  });

  it("translates text using Google GTX mock successfully", async () => {
    // Mock fetch for Google GTX
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        [["Khả năng phục hồi", "Resilience"]],
        null,
        "en",
      ],
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Resilience" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.translation).toBe("Khả năng phục hồi");
    expect(data.originalText).toBe("Resilience");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("returns cached result on repeated query", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        [["Học tập kiên trì", "Persistent learning"]],
        null,
        "en",
      ],
    } as unknown as Response);

    const req1 = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Persistent learning" }),
    });

    const res1 = await POST(req1);
    const data1 = await res1.json();
    expect(data1.translation).toBe("Học tập kiên trì");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second request should use cache, without calling fetch again
    const req2 = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Persistent learning" }),
    });

    const res2 = await POST(req2);
    const data2 = await res2.json();
    expect(data2.fromCache).toBe(true);
    expect(data2.translation).toBe("Học tập kiên trì");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns 502 without AI fallback when Google Translate fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Uncached test failure sentence" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Google Translate");
  });
});
