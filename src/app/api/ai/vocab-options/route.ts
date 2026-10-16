import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { ReviewRepository } from "@/repositories/review.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRESET_PACKS = [
  {
    id: "preset-ielts",
    title: "IELTS 7.5+ Band Boosters",
    description: "Bộ từ học thuật ấn tượng cho Writing & Speaking",
    words: [
      { word: "ubiquitous", meaning: "phổ biến, có mặt khắp nơi", pos: "adjective" },
      { word: "scrutinize", meaning: "xem xét, nghiên cứu kỹ lưỡng", pos: "verb" },
      { word: "resilient", meaning: "kiên cường, có khả năng phục hồi nhanh", pos: "adjective" },
      { word: "mitigate", meaning: "làm giảm bớt, làm dịu bớt hậu quả", pos: "verb" },
      { word: "anomaly", meaning: "sự bất thường, dị thường", pos: "noun" },
      { word: "paradigm", meaning: "mô hình, khuôn mẫu tư duy", pos: "noun" },
    ],
  },
  {
    id: "preset-tech",
    title: "Tech Startup & Silicon Valley",
    description: "Từ vựng công nghệ, khởi nghiệp và đổi mới sáng tạo",
    words: [
      { word: "disrupt", meaning: "làm gián đoạn, đột phá thị trường", pos: "verb" },
      { word: "scalable", meaning: "có khả năng mở rộng quy mô", pos: "adjective" },
      { word: "pivot", meaning: "xoay chuyển chiến lược kinh doanh", pos: "verb" },
      { word: "leverage", meaning: "tận dụng tối đa đòn bẩy", pos: "verb" },
      { word: "bottleneck", meaning: "điểm nghẽn, trở ngại cản trở", pos: "noun" },
      { word: "traction", meaning: "sự đón nhận, đà phát triển của sản phẩm", pos: "noun" },
    ],
  },
  {
    id: "preset-daily",
    title: "Everyday Conversational Nuance",
    description: "Diễn đạt tự nhiên, hóm hỉnh trong giao tiếp hàng ngày",
    words: [
      { word: "spontaneous", meaning: "ngẫu hứng, tự phát", pos: "adjective" },
      { word: "reluctant", meaning: "miễn cưỡng, ngần ngại", pos: "adjective" },
      { word: "elaborate", meaning: "giải thích chi tiết hơn, tỉ mỉ", pos: "verb" },
      { word: "coincidence", meaning: "sự trùng hợp ngẫu nhiên", pos: "noun" },
      { word: "awkward", meaning: "ngượng ngùng, lúng túng", pos: "adjective" },
      { word: "overwhelmed", meaning: "bị choáng ngợp, quá tải cảm xúc", pos: "adjective" },
    ],
  },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: true,
        sets: [],
        dueWords: [],
        presets: PRESET_PACKS,
      });
    }

    // Fetch user's sets
    const { data: rawSets } = await VocabSetRepository.getVocabSets(user.id, {
      limit: 20,
      sort: "updated_at_desc",
    });

    const setsWithWords = await Promise.all(
      (rawSets || []).slice(0, 10).map(async (s) => {
        const words = await VocabularyRepository.getBySetId(s.id, user.id);
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          color: s.color,
          wordCount: words.length,
          words: words.map((w) => ({
            id: w.id,
            word: w.word,
            meaning: w.meaning,
            pos: w.part_of_speech,
          })),
        };
      })
    );

    // Fetch due review words
    let dueWords: Array<{ id: string; word: string; meaning: string; pos?: string | null }> = [];
    try {
      const dueReviews = await ReviewRepository.getDueReviews(user.id);
      dueWords = dueReviews.slice(0, 12).map((item) => ({
        id: item.vocabulary.id,
        word: item.vocabulary.word,
        meaning: item.vocabulary.meaning,
        pos: item.vocabulary.part_of_speech,
      }));
    } catch (e) {
      console.warn("Could not fetch due reviews:", e);
    }

    return NextResponse.json({
      success: true,
      sets: setsWithWords,
      dueWords,
      presets: PRESET_PACKS,
    });
  } catch (error) {
    console.error("[Vocab Options API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách từ vựng",
        presets: PRESET_PACKS,
      },
      { status: 500 }
    );
  }
}
