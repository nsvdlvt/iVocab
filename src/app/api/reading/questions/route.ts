import { NextResponse } from "next/server";
import { getQuestionsForArticle, DEFAULT_READING_QUESTIONS } from "@/lib/reading/reading-questions";
import type { ComprehensionQuestion } from "@/components/features/reading/reading-types";
import { DEFAULT_AI_MODELS, getAiApiKey, getAiBaseUrl, AI_MODEL } from "@/lib/ai/constants";
import { extractJsonPayload, requestTextResponse } from "@/lib/ai/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      slug?: string;
      title?: string;
      paragraphs?: Array<{ text: string } | string>;
      forceRegenerate?: boolean;
    } | null;

    const slug = body?.slug?.trim();
    const title = body?.title?.trim() ?? "Reading Article";
    const paragraphs = (body?.paragraphs ?? [])
      .map((p) => (typeof p === "string" ? p : p?.text ?? ""))
      .filter((p) => p.trim().length > 0);

    // If predefined questions exist and not forced to regenerate, return them immediately
    if (slug && !body?.forceRegenerate) {
      const predefined = getQuestionsForArticle(slug);
      if (predefined.length > 0) {
        return NextResponse.json({
          questions: predefined,
          source: "curated",
        });
      }
    }

    const fullText = paragraphs.join("\n\n");
    if (!fullText) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp nội dung bài đọc để tạo câu hỏi." },
        { status: 400 }
      );
    }

    const apiKey = getAiApiKey();
    const baseURL = getAiBaseUrl();

    if (!apiKey) {
      const fallback = slug ? DEFAULT_READING_QUESTIONS[slug] ?? [] : [];
      return NextResponse.json({ questions: fallback, source: "curated" });
    }

    const prompt = `Bạn là chuyên gia khảo thí và biên soạn bài tập Reading Comprehension tiếng Anh (chuẩn IELTS/TOEFL/CEFR).
Dưới đây là một bài đọc tiếng Anh có tiêu đề "${title}":

${fullText}

Nhiệm vụ:
Tạo 3-4 câu hỏi đọc hiểu (Multiple Choice Questions) bằng tiếng Anh chất lượng cao kiểm tra:
1. Ý chính / Mục đích bài viết (Main idea / Author's purpose)
2. Chi tiết cụ thể trong bài (Detailed facts)
3. Suy luận / Từ vựng trong ngữ cảnh (Inference / Vocabulary in context)

Yêu cầu định dạng đầu ra BẮT BUỘC là một JSON Array hợp lệ, KHÔNG có markdown, KHÔNG có văn bản dẫn nhập. Mỗi phần tử có cấu trúc sau:
[
  {
    "id": "q1",
    "question": "Nội dung câu hỏi bằng tiếng Anh?",
    "options": [
      "Lựa chọn A",
      "Lựa chọn B",
      "Lựa chọn C",
      "Lựa chọn D"
    ],
    "correctAnswer": 0,
    "explanation": "Giải thích chi tiết bằng tiếng Việt vì sao đáp án này đúng, dựa vào câu/đoạn nào trong bài đọc.",
    "paragraphRef": "Paragraph 1"
  }
]`;

    let generatedQuestions: ComprehensionQuestion[] | null = null;
    try {
      const rawText = await requestTextResponse(prompt, request.signal);
      if (rawText) {
        const parsed = extractJsonPayload(rawText) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated: ComprehensionQuestion[] = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i] as Record<string, unknown>;
            if (
              typeof item.question === "string" &&
              Array.isArray(item.options) &&
              item.options.length >= 2 &&
              typeof item.correctAnswer === "number" &&
              typeof item.explanation === "string"
            ) {
              validated.push({
                id: `q-${Date.now()}-${i + 1}`,
                question: item.question,
                options: item.options.map(String),
                correctAnswer: Math.max(0, Math.min(item.options.length - 1, item.correctAnswer)),
                explanation: item.explanation,
                paragraphRef: typeof item.paragraphRef === "string" ? item.paragraphRef : undefined,
              });
            }
          }

          if (validated.length > 0) {
            generatedQuestions = validated;
          }
        }
      }
    } catch (aiErr) {
      console.warn("[Reading Questions] AI generation error:", aiErr);
    }

    if (generatedQuestions && generatedQuestions.length > 0) {
      return NextResponse.json({
        questions: generatedQuestions,
        source: "ai",
      });
    }

    // Fallback to predefined if available
    const fallback = slug ? getQuestionsForArticle(slug) : [];
    return NextResponse.json({
      questions: fallback,
      source: "curated",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error generating questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
