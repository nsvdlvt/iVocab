import { NextResponse } from "next/server";
import { getWritingAssistantResponse } from "@/lib/ai/writing-assistant";
import { conversationMemory } from "@/lib/ai/conversationMemory";

export async function POST(request: Request) {
  try {
    const req = await request.json();
    if (req.type === "clear") {
      if (req.targetWord) {
        conversationMemory.clear(req.targetWord, req.language);
      }
      return NextResponse.json({ success: true });
    }

    if (!req.type || !req.targetWord) {
      return NextResponse.json({ error: "Missing type or targetWord" }, { status: 400 });
    }

    const result = await getWritingAssistantResponse(req, request.signal);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Writing Assistant API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
