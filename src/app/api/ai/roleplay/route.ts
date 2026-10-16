import { NextResponse } from "next/server";
import { requestTextResponse, extractJsonPayload } from "@/lib/ai/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface ScenarioDefinition {
  id: string;
  title: string;
  characterName: string;
  characterRole: string;
  iconName: "Coffee" | "Briefcase" | "Luggage" | "Building2";
  setting: string;
  goal: string;
  initialMessage: string;
}

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  "coffee-shop": {
    id: "coffee-shop",
    title: "The London Artisan Cafe",
    characterName: "Arthur",
    characterRole: "Barista tại Soho, London",
    iconName: "Coffee",
    setting: "Một quán cà phê ấm cúng giữa lòng phố cổ London vào một buổi sáng mưa lất phất.",
    goal: "Gọi một món đồ uống đặc biệt, miêu tả hương vị ưa thích và trò chuyện tự nhiên với Arthur.",
    initialMessage: "Good morning! Welcome to Soho Roasters. It's dreadfully chilly outside today, isn't it? What can I brew to warm you up this morning?",
  },
  "job-interview": {
    id: "job-interview",
    title: "Silicon Valley Tech Interview",
    characterName: "Elena",
    characterRole: "VP of Engineering & Hiring Manager",
    iconName: "Briefcase",
    setting: "Phòng họp kính tầng 28 tại San Francisco. Bạn đang ứng tuyển vị trí Product Lead / Senior Engineer.",
    goal: "Thuyết phục Elena về khả năng giải quyết vấn đề, tinh thần kiên trì và tư duy chiến lược của bạn.",
    initialMessage: "Hi there, great to meet you! I've gone through your portfolio, and your background looks intriguing. To kick things off, could you tell me about a time you faced a critical roadblock on a project and how you tackled it?",
  },
  "lost-luggage": {
    id: "lost-luggage",
    title: "Heathrow Airport Lost & Found",
    characterName: "Officer Davies",
    characterRole: "Baggage Services Officer",
    iconName: "Luggage",
    setting: "Quầy xử lý hành lý thất lạc tại sân bay Heathrow sau một chuyến bay dài mệt mỏi.",
    goal: "Báo cáo kiện hành lý bị thất lạc, mô tả chi tiết đồ đạc quan trọng và yêu cầu xử lý khẩn cấp.",
    initialMessage: "Hello. Take a breath, I know travel disruptions are terribly stressful. Can I see your boarding pass and claim tag? What did your missing luggage look like?",
  },
  "hotel-upgrade": {
    id: "hotel-upgrade",
    title: "The Grand Savoy Concierge",
    characterName: "Monsieur Laurent",
    characterRole: "Head Concierge",
    iconName: "Building2",
    setting: "Sảnh khách sạn 5 sao cổ kính. Bạn vừa nhận phòng nhưng không hài lòng với góc nhìn ra bãi đỗ xe.",
    goal: "Lịch sự nhưng khéo léo thương lượng để đổi sang phòng có view hướng biển/công viên mà không mất thêm phí.",
    initialMessage: "Bonsoir, Madame/Monsieur! I hope you are settling in nicely. Is there anything at all I can assist you with this evening?",
  },
};

interface RoleplayRequestBody {
  scenarioId: string;
  targetWords: string[];
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userInput: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu cấu hình GEMINI_API_KEY trong .env.local" },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => null)) as RoleplayRequestBody | null;
    if (!body || !body.scenarioId || !body.userInput) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    const scenario = SCENARIOS[body.scenarioId] || SCENARIOS["coffee-shop"];
    const targetWords = body.targetWords || [];
    const conversationHistory = (body.messages || []).slice(-8);

    const historyText = conversationHistory
      .map((m) => `${m.role === "user" ? "User" : scenario.characterName}: "${m.content}"`)
      .join("\n");

    const prompt = `Bạn đang tham gia bài luyện tập nhập vai tiếng Anh (Roleplay Mission) cho ứng dụng học từ vựng Vocabee.

BỐI CẢNH & NHÂN VẬT CỦA BẠN:
- Kịch bản: ${scenario.title}
- Nhân vật bạn đóng vai: ${scenario.characterName} (${scenario.characterRole})
- Không gian: ${scenario.setting}
- Mục tiêu của người học: ${scenario.goal}

DANH SÁCH TỪ VỰNG MỤC TIÊU NGƯỜI DÙNG CẦN SỬ DỤNG:
${targetWords.map((w) => `- ${w}`).join("\n")}

LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${historyText || "(Bắt đầu hội thoại)"}

CÂU NÓI MỚI NHẤT CỦA NGƯỜI DÙNG:
"${body.userInput}"

NHIỆM VỤ CỦA BẠN:
1. Phát hiện từ vựng: Kiểm tra xem trong câu nói mới nhất của người dùng, người dùng đã sử dụng những từ vựng mục tiêu nào (tính cả dạng chia thì, số nhiều).
2. Nhập vai phản hồi (reply): Trả lời đúng tính cách nhân vật ${scenario.characterName} bằng tiếng Anh giao tiếp tự nhiên, giàu cảm xúc, thúc đẩy cuộc trò chuyện tiếp diễn (khoảng 2-3 câu).
3. Huấn luyện viên AI (coachingTip): Nhận xét ngắn gọn 1-2 câu bằng tiếng Việt về cách dùng từ hoặc gợi ý cách diễn đạt tự nhiên hơn của người bản xứ.
4. Đánh giá hoàn thành (isGoalMet): true nếu câu chuyện đã giải quyết xong tình huống hoặc người dùng đã vận dụng thành thạo từ vựng.

TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON DUY NHẤT:
{
  "detectedWords": ["từ1", "từ2"],
  "reply": "Câu trả lời tiếng Anh của nhân vật...",
  "coachingTip": "Lời khen hoặc nhận xét tiếng Việt ngắn gọn...",
  "isGoalMet": false
}`;

    const rawResponse = await requestTextResponse(prompt, request.signal);
    const parsed = extractJsonPayload(rawResponse) as {
      detectedWords: string[];
      reply: string;
      coachingTip: string;
      isGoalMet?: boolean;
    };

    return NextResponse.json({
      success: true,
      data: {
        detectedWords: Array.isArray(parsed.detectedWords) ? parsed.detectedWords : [],
        reply: parsed.reply || "I see! Could you tell me more about that?",
        coachingTip: parsed.coachingTip || "",
        isGoalMet: Boolean(parsed.isGoalMet),
      },
    });
  } catch (error: unknown) {
    console.error("[AI Roleplay API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo phản hồi nhập vai.",
      },
      { status: 500 }
    );
  }
}
