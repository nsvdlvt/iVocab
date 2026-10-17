import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface QualityIssue {
  id: string;
  category: "vocabulary" | "vocab_set" | "reading";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  recordId: string;
  recordName: string;
  editUrl: string;
}

export interface QualitySummary {
  overallScore: number;
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  issues: QualityIssue[];
}

export class AdminQualityRepository {
  private static async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
  }

  static async runQualityAudit(): Promise<QualitySummary> {
    const supabase = await this.getSupabase();
    const issues: QualityIssue[] = [];

    // 1. Check Vocabularies
    const { data: words } = await supabase
      .from("vocabularies")
      .select("id, word, ipa, meaning, part_of_speech, example, set_id")
      .limit(300);

    if (words) {
      // Track duplicates
      const seenWords = new Map<string, string>();

      for (const w of words) {
        // Missing meaning (High)
        if (!w.meaning || w.meaning.trim() === "") {
          issues.push({
            id: `issue_meaning_${w.id}`,
            category: "vocabulary",
            severity: "high",
            title: "Thiếu nghĩa tiếng Việt",
            description: `Từ "${w.word}" chưa có định nghĩa hoặc nghĩa tiếng Việt`,
            recordId: w.id,
            recordName: w.word,
            editUrl: `/admin/vocabulary-words?search=${encodeURIComponent(w.word)}`,
          });
        }

        // Missing IPA (Medium)
        if (!w.ipa || w.ipa.trim() === "") {
          issues.push({
            id: `issue_ipa_${w.id}`,
            category: "vocabulary",
            severity: "medium",
            title: "Thiếu phiên âm quốc tế (IPA)",
            description: `Từ "${w.word}" chưa có phiên âm IPA hỗ trợ phát âm`,
            recordId: w.id,
            recordName: w.word,
            editUrl: `/admin/vocabulary-words?search=${encodeURIComponent(w.word)}`,
          });
        }

        // Missing Example (Low)
        if (!w.example || w.example.trim() === "") {
          issues.push({
            id: `issue_example_${w.id}`,
            category: "vocabulary",
            severity: "low",
            title: "Chưa có câu ví dụ",
            description: `Từ "${w.word}" chưa có câu ví dụ thực tế minh họa`,
            recordId: w.id,
            recordName: w.word,
            editUrl: `/admin/vocabulary-words?search=${encodeURIComponent(w.word)}`,
          });
        }

        // Missing Part of Speech (Medium)
        if (!w.part_of_speech || w.part_of_speech.trim() === "") {
          issues.push({
            id: `issue_pos_${w.id}`,
            category: "vocabulary",
            severity: "medium",
            title: "Thiếu từ loại (Part of Speech)",
            description: `Từ "${w.word}" chưa được phân loại danh từ, động từ, v.v.`,
            recordId: w.id,
            recordName: w.word,
            editUrl: `/admin/vocabulary-words?search=${encodeURIComponent(w.word)}`,
          });
        }

        // Duplicate word check in same set
        const duplicateKey = `${w.set_id}_${w.word.toLowerCase()}`;
        if (seenWords.has(duplicateKey)) {
          issues.push({
            id: `issue_dup_${w.id}`,
            category: "vocabulary",
            severity: "medium",
            title: "Từ vựng bị trùng lặp trong bộ",
            description: `Từ "${w.word}" xuất hiện nhiều hơn một lần trong cùng bộ từ`,
            recordId: w.id,
            recordName: w.word,
            editUrl: `/admin/vocabulary-words?search=${encodeURIComponent(w.word)}`,
          });
        } else {
          seenWords.set(duplicateKey, w.id);
        }
      }
    }

    // 2. Check Empty Vocab Sets
    const { data: sets } = await supabase
      .from("vocab_sets")
      .select("id, title")
      .limit(100);

    if (sets) {
      for (const s of sets) {
        const { count } = await supabase
          .from("vocabularies")
          .select("id", { count: "exact", head: true })
          .eq("set_id", s.id);

        if (count === 0) {
          issues.push({
            id: `issue_empty_set_${s.id}`,
            category: "vocab_set",
            severity: "medium",
            title: "Bộ từ vựng trống (0 từ)",
            description: `Bộ từ vựng "${s.title}" không có bất kỳ từ nào bên trong`,
            recordId: s.id,
            recordName: s.title,
            editUrl: `/admin/vocabulary-sets/${s.id}`,
          });
        }
      }
    }

    // 3. Check Reading Articles
    const { data: articles } = await supabase
      .from("reading_articles")
      .select("id, title, status, vietnamese_content, english_content")
      .limit(50);

    if (articles) {
      for (const a of articles) {
        // Missing translation check
        const viContent = a.vietnamese_content as { paragraphs?: unknown[] } | null;
        if (!viContent || !Array.isArray(viContent?.paragraphs) || viContent.paragraphs.length === 0) {
          issues.push({
            id: `issue_reading_trans_${a.id}`,
            category: "reading",
            severity: "high",
            title: "Bài đọc thiếu bản dịch tiếng Việt",
            description: `Bài đọc "${a.title}" chưa có đoạn dịch tiếng Việt tương ứng`,
            recordId: a.id,
            recordName: a.title,
            editUrl: `/admin/reading/${a.id}`,
          });
        }

        // Draft articles pending publication
        if (a.status === "draft") {
          issues.push({
            id: `issue_reading_draft_${a.id}`,
            category: "reading",
            severity: "low",
            title: "Bài đọc ở trạng thái bản nháp",
            description: `Bài đọc "${a.title}" chưa được xuất bản ra ngoài hệ thống`,
            recordId: a.id,
            recordName: a.title,
            editUrl: `/admin/reading/${a.id}`,
          });
        }
      }
    }

    const high = issues.filter((i) => i.severity === "high").length;
    const med = issues.filter((i) => i.severity === "medium").length;
    const low = issues.filter((i) => i.severity === "low").length;

    // Quality Score out of 100
    const penalty = high * 5 + med * 2 + low * 0.5;
    const score = Math.max(0, Math.round(100 - penalty));

    return {
      overallScore: score,
      totalIssues: issues.length,
      highSeverityCount: high,
      mediumSeverityCount: med,
      lowSeverityCount: low,
      issues,
    };
  }
}
