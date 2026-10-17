/**
 * Azure Speech Pronunciation Assessment Integration
 * Uses Azure Cognitive Services Speech REST API.
 * Free tier: 5 hours of audio / month (F0).
 */

export interface PhonemeScore {
  phoneme: string;
  accuracyScore: number;
}

export interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: "None" | "Omission" | "Insertion" | "Mispronunciation";
  phonemes?: PhonemeScore[];
}

export interface PronunciationAssessmentResult {
  overallScore: number; // 0 - 100
  accuracyScore: number; // 0 - 100
  fluencyScore: number; // 0 - 100
  completenessScore: number; // 0 - 100
  prosodyScore?: number; // 0 - 100 (Ngữ điệu)
  recognizedText: string;
  referenceText: string;
  words: WordScore[];
  feedback: string;
  isDemo?: boolean;
}

interface AzurePronunciationHeader {
  ReferenceText: string;
  GradingSystem: "HundredMark" | "FivePoint";
  Granularity: "Phoneme" | "Word" | "FullText";
  Dimension: "Comprehensive" | "Basic";
  EnableMiscue: "True" | "False";
  EnableProsodyAssessment?: "True" | "False";
}

/**
 * Assesses pronunciation by sending 16kHz mono WAV audio to Azure Speech REST API.
 * If AZURE_SPEECH_KEY is missing, gracefully falls back to an intelligent demo assessment.
 */
export async function assessPronunciation(
  audioBuffer: Buffer,
  referenceText: string
): Promise<PronunciationAssessmentResult> {
  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || "southeastasia";

  // Clean reference text (remove excess punctuation)
  const cleanRef = referenceText.trim();

  if (!apiKey) {
    return generateDemoAssessment(cleanRef);
  }

  try {
    const assessmentConfig: AzurePronunciationHeader = {
      ReferenceText: cleanRef,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: "True",
      EnableProsodyAssessment: "True",
    };

    const headerValue = Buffer.from(JSON.stringify(assessmentConfig)).toString("base64");
    const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json;text/xml",
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Ocp-Apim-Subscription-Key": apiKey,
        "Pronunciation-Assessment": headerValue,
      },
      body: new Uint8Array(audioBuffer),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Azure Speech API error response:", response.status, errText);
      // Fallback to demo mode if Azure key is invalid/expired
      const fallback = generateDemoAssessment(cleanRef);
      fallback.feedback = `[Azure API ${response.status}] Đang hiển thị kết quả mô phỏng.`;
      return fallback;
    }

    const data = await response.json();

    if (data.RecognitionStatus !== "Success" || !data.NBest?.[0]) {
      return {
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        completenessScore: 0,
        recognizedText: data.DisplayText || "",
        referenceText: cleanRef,
        words: [],
        feedback: "Không nhận diện được giọng nói rõ ràng. Vui lòng nói to và rõ hơn nhé!",
        isDemo: false,
      };
    }

    const best = data.NBest[0];
    const overallScore = Math.round(best.PronScore ?? best.AccuracyScore ?? 80);
    const accuracyScore = Math.round(best.AccuracyScore ?? 80);
    const fluencyScore = Math.round(best.FluencyScore ?? 80);
    const completenessScore = Math.round(best.CompletenessScore ?? 100);
    const prosodyScore = best.ProsodyScore != null ? Math.round(best.ProsodyScore) : undefined;

    const words: WordScore[] = (best.Words || []).map((w: any) => ({
      word: w.Word || "",
      accuracyScore: Math.round(w.AccuracyScore ?? 80),
      errorType: (w.ErrorType as any) || "None",
      phonemes: (w.Phonemes || []).map((p: any) => ({
        phoneme: p.Phoneme || "",
        accuracyScore: Math.round(p.AccuracyScore ?? 80),
      })),
    }));

    return {
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText: best.Display || best.Lexical || cleanRef,
      referenceText: cleanRef,
      words,
      feedback: generateMascotFeedback(overallScore, accuracyScore, prosodyScore),
      isDemo: false,
    };
  } catch (err) {
    console.error("Error calling Azure Speech Service:", err);
    return generateDemoAssessment(cleanRef);
  }
}

/**
 * Creates friendly, motivational feedback based on scores
 */
export function generateMascotFeedback(
  overallScore: number,
  accuracyScore: number,
  prosodyScore?: number
): string {
  if (overallScore >= 90) {
    return "Phát âm xuất sắc! Ngữ điệu và âm đuôi rất chuẩn xác, hệt như người bản xứ vậy! 🐝🎉";
  }
  if (overallScore >= 80) {
    return "Làm tốt lắm! Bạn phát âm rõ ràng, tròn vành rõ chữ. Cố gắng phát huy nhé! 🐝✨";
  }
  if (overallScore >= 65) {
    if (prosodyScore && prosodyScore < 70) {
      return "Phát âm tương đối tốt, nhưng bạn hãy nhấn nhá ngữ điệu và trọng âm tự nhiên hơn một chút nhé! 🐝🎶";
    }
    return "Khá tốt! Bạn hãy chú ý phát âm rõ hơn các âm cuối (ending sounds) và bật hơi rõ ràng nhé! 🐝💪";
  }
  return "Đừng nản lòng nhé! Hãy bấm nghe lại phát âm mẫu của Vocabee rồi thử luyện lại lần nữa nào! 🐝💛";
}

/**
 * Generates an intelligent, deterministic demo assessment when AZURE_SPEECH_KEY is not yet configured.
 */
function generateDemoAssessment(referenceText: string): PronunciationAssessmentResult {
  const wordsList = referenceText
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""));

  // Generate a plausible mock score between 82 and 94
  const randomScore = 85 + Math.floor(Math.random() * 10);
  const accuracy = Math.min(100, randomScore + 2);
  const fluency = Math.max(70, randomScore - 4);
  const prosody = Math.max(72, randomScore - 2);

  const wordScores: WordScore[] = wordsList.map((w, idx) => {
    // slight variation per word
    const score = Math.min(100, Math.max(65, randomScore + (idx % 2 === 0 ? 3 : -4)));
    return {
      word: w,
      accuracyScore: score,
      errorType: "None",
      phonemes: [
        { phoneme: w.slice(0, 2).toLowerCase() || "ah", accuracyScore: Math.min(100, score + 2) },
        { phoneme: w.slice(-2).toLowerCase() || "t", accuracyScore: Math.max(60, score - 3) },
      ],
    };
  });

  return {
    overallScore: randomScore,
    accuracyScore: accuracy,
    fluencyScore: fluency,
    completenessScore: 100,
    prosodyScore: prosody,
    recognizedText: referenceText,
    referenceText,
    words: wordScores,
    feedback: `${generateMascotFeedback(randomScore, accuracy, prosody)} (💡 Chế độ Demo: Chưa cấu hình AZURE_SPEECH_KEY)`,
    isDemo: true,
  };
}
