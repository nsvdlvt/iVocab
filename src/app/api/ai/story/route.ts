import { NextResponse } from "next/server";
import { requestTextResponse, extractJsonPayload } from "@/lib/ai/json-response";
import { getAiApiKey } from "@/lib/ai/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TargetWordInput {
  word: string;
  meaning?: string;
  pos?: string;
}

interface StoryRequestBody {
  words: Array<string | TargetWordInput>;
  genre?: string;
  level?: string;
  length?: "short" | "medium";
}

export interface StoryResponsePayload {
  title: string;
  genre: string;
  level: string;
  readTimeMinutes: number;
  summary: string;
  paragraphs: Array<{
    english: string;
    vietnamese: string;
    wordsUsed: string[];
  }>;
  targetWords: Array<{
    word: string;
    ipa: string;
    pos: string;
    meaning: string;
    contextUsage: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
}

const GENRE_DESCRIPTIONS: Record<string, string> = {
  mystery: "Trinh thám gay cấn, bí ẩn, phong cách Sherlock Holmes hoặc Noir Detective",
  "sci-fi": "Khoa học viễn tưởng, vũ trụ, du hành thời gian hoặc công nghệ Cyberpunk",
  "slice-of-life": "Đời thường ấm áp, quán cà phê, tình bạn, lắng đọng và gần gũi",
  comedy: "Hài hước, dí dỏm, tình huống trớ trêu dở khóc dở cười",
  fantasy: "Kỳ ảo, phép thuật, vùng đất cổ tích hoặc chuyến phiêu lưu huyền thoại",
  business: "Thương trường gay cấn, khởi nghiệp công nghệ, đàm phán hợp đồng triệu đô",
};

export async function POST(request: Request) {
  try {
    const apiKey = getAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu cấu hình AI API key trong .env.local" },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => null)) as StoryRequestBody | null;
    if (!body || !Array.isArray(body.words) || body.words.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp ít nhất 2 từ vựng để dệt câu chuyện." },
        { status: 400 }
      );
    }

    const normalizedWords = body.words.map((item) => {
      if (typeof item === "string") return { word: item.trim() };
      return {
        word: item.word.trim(),
        meaning: item.meaning?.trim(),
        pos: item.pos?.trim(),
      };
    }).filter((w) => w.word.length > 0);

    if (normalizedWords.length === 0) {
      return NextResponse.json(
        { success: false, error: "Danh sách từ vựng không hợp lệ." },
        { status: 400 }
      );
    }

    const genre = body.genre || "slice-of-life";
    const level = body.level || "B2";
    const length = body.length || "short";
    const genreDesc = GENRE_DESCRIPTIONS[genre] || GENRE_DESCRIPTIONS["slice-of-life"];

    const wordListFormatted = normalizedWords
      .map((w) => `- ${w.word}${w.pos ? ` (${w.pos})` : ""}${w.meaning ? `: ${w.meaning}` : ""}`)
      .join("\n");

    const prompt = `Bạn là một nhà văn và chuyên gia ngôn ngữ tiếng Anh hàng đầu cho ứng dụng học từ vựng Vocabee.
Nhiệm vụ của bạn là dệt một câu chuyện ngắn cực kỳ cuốn hút, giàu hình ảnh và tự nhiên, lồng ghép khéo léo TẤT CẢ các từ vựng mục tiêu dưới đây:

Danh sách từ vựng mục tiêu (BẮT BUỘC phải dùng tất cả các từ này trong câu chuyện):
${wordListFormatted}

Yêu cầu câu chuyện:
1. Thể loại: ${genreDesc} (Genre code: ${genre}).
2. Độ khó ngôn ngữ: CEFR ${level}. Câu văn tự nhiên, chuẩn văn phong bản xứ, không gượng ép.
3. Độ dài: ${length === "short" ? "3 đến 4 đoạn văn ngắn (khoảng 150-250 từ tiếng Anh)" : "4 đến 5 đoạn văn (khoảng 250-380 từ tiếng Anh)"}.
4. Mỗi đoạn văn phải có:
   - "english": Đoạn văn tiếng Anh.
   - "vietnamese": Bản dịch tiếng Việt mượt mà, văn phong truyền cảm.
   - "wordsUsed": Mảng các từ vựng mục tiêu xuất hiện trong đoạn đó (dạng nguyên mẫu hoặc biến thể chia thì/số nhiều).
5. Phân tích từ vựng (targetWords):
   - Cung cấp: word (nguyên thể), ipa (phiên âm chuẩn), pos (noun, verb, adjective, adverb...), meaning (nghĩa tiếng Việt súc tích), contextUsage (giải thích ngắn gọn sắc thái tại sao từ này được dùng trong câu chuyện).
6. Thử thách đọc hiểu (quiz):
   - Tạo 2 câu hỏi trắc nghiệm tiếng Anh (4 đáp án A, B, C, D) kiểm tra mức độ hiểu cốt truyện và cách dùng từ.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON DUY NHẤT (không bọc trong markdown hay text ngoài JSON):
{
  "title": "Tiêu đề tiếng Anh của câu chuyện",
  "genre": "${genre}",
  "level": "${level}",
  "readTimeMinutes": 2,
  "summary": "Tóm tắt 1-2 câu tiếng Việt về cốt truyện",
  "paragraphs": [
    {
      "english": "Paragraph 1 in English...",
      "vietnamese": "Đoạn 1 dịch sang tiếng Việt...",
      "wordsUsed": ["word1", "word2"]
    }
  ],
  "targetWords": [
    {
      "word": "targetWord",
      "ipa": "/.../",
      "pos": "verb",
      "meaning": "nghĩa tiếng Việt",
      "contextUsage": "Giải thích ngắn về vai trò của từ trong câu..."
    }
  ],
  "quiz": [
    {
      "question": "Comprehension question in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Giải thích ngắn gọn bằng tiếng Việt vì sao chọn đáp án này."
    }
  ]
}`;

    const rawResponse = await requestTextResponse(prompt, request.signal);
    const parsed = extractJsonPayload(rawResponse) as StoryResponsePayload;

    if (!parsed || !parsed.title || !Array.isArray(parsed.paragraphs) || parsed.paragraphs.length === 0) {
      throw new Error("Phản hồi câu chuyện từ AI không đủ cấu trúc yêu cầu.");
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: unknown) {
    console.error("[AI Storyteller API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo câu chuyện AI.",
      },
      { status: 500 }
    );
  }
}
