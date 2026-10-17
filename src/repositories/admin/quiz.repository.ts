import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export interface QuizOverview {
  totalQuizzes: number;
  averageScorePercentage: number;
  totalQuestionsAnswered: number;
  scoreDistribution: {
    excellent: number; // 80-100%
    good: number;      // 50-79%
    needsWork: number; // 0-49%
  };
  totalSentencePractices: number;
  avgSentenceScore: number;
  avgGrammarScore: number;
  avgVocabularyScore: number;
}

export class AdminQuizRepository {
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

  static async getOverview(): Promise<QuizOverview> {
    const supabase = await this.getSupabase();

    const [quizzesRes, sentencesRes] = await Promise.all([
      supabase.from("quiz_history").select("score, correct_answers, total_questions", { count: "exact" }).limit(500),
      supabase.from("sentence_practice_history").select("overall_score, grammar_score, vocabulary_score", { count: "exact" }).limit(500),
    ]);

    const quizzes = quizzesRes.data || [];
    let sumScorePct = 0;
    let totalQuestions = 0;
    const distribution = { excellent: 0, good: 0, needsWork: 0 };

    for (const q of quizzes) {
      const pct = q.total_questions > 0 ? (q.correct_answers / q.total_questions) * 100 : q.score;
      sumScorePct += pct;
      totalQuestions += q.total_questions || 0;

      if (pct >= 80) distribution.excellent++;
      else if (pct >= 50) distribution.good++;
      else distribution.needsWork++;
    }

    const avgScorePct = quizzes.length > 0 ? Math.round(sumScorePct / quizzes.length) : 0;

    const sentences = sentencesRes.data || [];
    let sumOverall = 0;
    let sumGrammar = 0;
    let sumVocab = 0;

    for (const s of sentences) {
      sumOverall += s.overall_score || 0;
      sumGrammar += s.grammar_score || 0;
      sumVocab += s.vocabulary_score || 0;
    }

    const avgOverall = sentences.length > 0 ? Math.round(sumOverall / sentences.length) : 0;
    const avgGrammar = sentences.length > 0 ? Math.round(sumGrammar / sentences.length) : 0;
    const avgVocab = sentences.length > 0 ? Math.round(sumVocab / sentences.length) : 0;

    return {
      totalQuizzes: quizzesRes.count || quizzes.length,
      averageScorePercentage: avgScorePct,
      totalQuestionsAnswered: totalQuestions,
      scoreDistribution: distribution,
      totalSentencePractices: sentencesRes.count || sentences.length,
      avgSentenceScore: avgOverall,
      avgGrammarScore: avgGrammar,
      avgVocabularyScore: avgVocab,
    };
  }

  static async getRecentQuizzes(page: number = 1, pageSize: number = 10) {
    const supabase = await this.getSupabase();
    const { data, count, error } = await supabase
      .from("quiz_history")
      .select("*, profiles(id, email, display_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  static async getRecentSentenceAttempts(page: number = 1, pageSize: number = 10) {
    const supabase = await this.getSupabase();
    const { data, count, error } = await supabase
      .from("sentence_practice_history")
      .select("*, profiles(id, email, display_name), vocabularies(word, meaning)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}
