import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`,
    { cache: "force-cache" }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  const data = (await response.json()) as unknown;
  const translation = Array.isArray(data)
    ? (data[0] as unknown[])
        .map((part) => (Array.isArray(part) ? part[0] : ""))
        .join("")
        .trim()
    : "";

  if (!translation) {
    return NextResponse.json({ error: "Empty translation" }, { status: 502 });
  }

  return NextResponse.json({ translation });
}
