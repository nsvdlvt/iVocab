import { NextRequest, NextResponse } from "next/server";
import { assessPronunciation } from "@/lib/speech/azure-speech";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const referenceText = formData.get("referenceText");

    if (!referenceText || typeof referenceText !== "string") {
      return NextResponse.json(
        { success: false, error: "Văn bản mẫu (referenceText) không hợp lệ" },
        { status: 400 }
      );
    }

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Tệp âm thanh (audio) không hợp lệ" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const result = await assessPronunciation(audioBuffer, referenceText);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Pronunciation assessment route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Đã có lỗi xảy ra khi chấm điểm phát âm",
      },
      { status: 500 }
    );
  }
}
