import { NextResponse } from "next/server";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { sessionId } = await params;
  const session = await ReviewSessionStore.get(sessionId);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Không tìm thấy phiên ôn tập." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, session });
}
