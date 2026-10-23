import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/learning/translate", () => {
  it("should return 400 when text is empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/learning/translate", {
      method: "POST",
      body: JSON.stringify({ text: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });

  it("should return translation result for valid English text", async () => {
    const req = new NextRequest("http://localhost:3000/api/learning/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "Patience and persistence are key to success.",
        sourceLang: "en",
        targetLang: "vi",
        includeLearningAnalysis: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.translatedText).toBeDefined();
    expect(json.data.targetLang).toBe("vi");
  });
});
