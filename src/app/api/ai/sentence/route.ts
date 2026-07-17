import { NextResponse } from "next/server";
import { evaluateWriting } from "@/lib/ai/sentence-practice";
import { createClient } from "@/lib/supabase/server";
import { SentenceHistoryRepository } from "@/repositories/sentence-history.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { ReviewSessionStore } from "@/lib/review-session/review-session-store";

function extractScore(explanation: string | undefined, categoryName: string): number {
  if (!explanation) return 10;
  const sections = explanation.split(/###\s+/);
  for (const section of sections) {
    const lines = section.split("\n");
    const name = lines[0].trim().toLowerCase();
    const targetName = categoryName.toLowerCase();
    if (name.includes(targetName)) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- Điểm:")) {
          const match = trimmed.match(/- Điểm:\s*(\d+)/);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
  }
  return 10; // default to 10
}

export async function POST(request: Request) {
  console.log("Sentence API: [1] Request received");
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Sentence API: [2] Request body parsed successfully:", JSON.stringify(body));
    const { word, sentence, options, setId, vocabId, reviewSessionId } = body;
    
    if (!word || !sentence || !setId || !vocabId) {
      console.warn("Sentence API: Validation failed - missing parameters");
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    console.log(`Sentence API: [3] Starting evaluation for word: "${word}", sentence: "${sentence}"`);
    const result = await evaluateWriting(word, sentence, {
      meaning: options?.meaning,
      partOfSpeech: options?.partOfSpeech,
      abortSignal: request.signal,
    });

    console.log("Sentence API: [4] Evaluation completed successfully. Saving to database...");

    const mistakesCount = result.mistakes.length;
    const overallScore = result.usedTargetWord === false ? 0 : (mistakesCount === 0 ? 100 : Math.max(0, 100 - mistakesCount * 12));

    const grammarScore = extractScore(result.explanation, "grammar") || extractScore(result.explanation, "ngữ pháp");
    const vocabularyScore = extractScore(result.explanation, "vocab") || extractScore(result.explanation, "từ vựng");
    const naturalnessScore = extractScore(result.explanation, "natural") || extractScore(result.explanation, "tự nhiên");
    const contextScore = extractScore(result.explanation, "context") || extractScore(result.explanation, "ngữ cảnh");
    const richnessScore = extractScore(result.explanation, "richness") || extractScore(result.explanation, "độ phong phú");

    await SentenceHistoryRepository.create(user.id, {
      vocab_set_id: setId,
      vocab_id: vocabId,
      attempt_number: 1, // Will be overridden in repository with actual count + 1
      overall_score: overallScore,
      grammar_score: grammarScore,
      vocabulary_score: vocabularyScore,
      naturalness_score: naturalnessScore,
      context_score: contextScore,
      richness_score: richnessScore,
      used_correctly: !!result.usedTargetWord,
      user_sentence: sentence,
      corrected_sentence: result.correctedSentence || null,
      advanced_sentence: null,
      mistakes_json: result.mistakes,
      feedback_json: result,
      feedback_language: "Vietnamese",
    });

    await ReviewRepository.processResult({
      userId: user.id,
      vocabularyId: vocabId,
      mode: "sentence-practice",
      answerResult: result.usedTargetWord ? "correct" : "wrong",
    });

    if (reviewSessionId) {
      const session = await ReviewSessionStore.markCompleted(reviewSessionId, vocabId);
      if (session && ReviewSessionStore.isComplete(session)) {
        await ReviewSessionStore.delete(reviewSessionId);
        return NextResponse.json({ ...result, completed: true });
      }
    }

    console.log("Sentence API: [5] Saved history to database successfully.");

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Sentence API Error:", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
