export interface ContextualMcqVocabInput {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  ipa?: string | null;
  example?: string | null;
  example_translation?: string | null;
  synonyms?: string[] | null;
  note?: string | null;
  srsLevel?: number;
  isWeak?: boolean;
}

export function buildContextualMcqPrompt(
  items: ContextualMcqVocabInput[],
  targetItemCount: number = 5
): string {
  const vocabLines = items
    .slice(0, 15)
    .map((item, idx) => {
      const parts = [
        `id: "${item.id}"`,
        `word: "${item.word}"`,
        `meaning: "${item.meaning}"`,
        `pos: "${item.partOfSpeech || "unknown"}"`,
        item.example ? `example: "${item.example}"` : null,
        item.example_translation ? `example_translation: "${item.example_translation}"` : null,
        item.synonyms?.length ? `synonyms/collocations: "${item.synonyms.join(", ")}"` : null,
        `srs_level: ${item.srsLevel ?? 0}`,
        item.isWeak ? `[PRIORITY: WEAK WORD - REVISIT]` : null,
      ].filter(Boolean);

      return `${idx + 1}. ${parts.join(" | ")}`;
    })
    .join("\n");

  return `You are an expert English lexicographer and test designer (TOEIC 990 / IELTS 9.0 examiner level).
Your task is to generate challenging, high-quality contextual multiple-choice questions (MCQs) for the provided vocabulary list.

CRITICAL OBJECTIVE:
Contextual MCQs must be DELIBERATELY CHALLENGING with HIGHLY PLAUSIBLE DISTRACTORS.
The objective is to test whether the learner understands the precise meaning, collocation, register, grammatical behavior, and contextual implications of a word — NOT whether they can easily eliminate obviously irrelevant options.

STRICT GENERATION RULES:
1. Sentence Context:
   - Write a natural, authentic, sufficiently informative sentence or two-sentence mini-passage (18-35 words).
   - Use the blank placeholder "______" (6 underscores) for the missing word.
   - The context must provide enough subtle semantic, register, or collocational clues so that EXACTLY ONE option is defensibly the best answer.
   - Do NOT write unnatural sentences just to force an answer.
   - Do NOT rely on obscure factual trivia.

2. Four Plausible Options:
   - Provide EXACTLY 4 options for each question.
   - ALL 4 options must be grammatically parallel (same part of speech, same grammatical tense/form/inflection).
   - The distractors MUST be semantically close: near-synonyms, commonly confused words, or competing vocabulary that sounds plausible in the sentence.
   - Prefer words from the provided vocabulary set or closely related professional/academic vocabulary.

3. Testing Nuance and Collocation:
   - Test natural collocations (e.g., "reach an agreement" vs "achieve/gain/acquire"), subtle connotations (e.g., "exacerbate" vs "alleviate/reduce"), and prepositional/phrasal constraints (e.g., "draw a conclusion" vs "make/reach").
   - Distinguish words by register (formal vs informal), intensity, or semantic restrictions.

4. Fairness & No Unfair Giveaways:
   - Exactly ONE option is defensibly best under the intended interpretation. No multiple valid answers!
   - NO grammatical giveaways: If the blank is preceded by an indefinite article, write "a/an ______" or structure the sentence so the article does not rule out consonants/vowels unless all 4 options begin with the same phonetic class.
   - NO length clues: Keep all 4 options relatively similar in word length.
   - Vary the position of the correct answer across indices 0, 1, 2, 3 (do NOT always place it in the same slot).

5. Detailed Explanations & Translation:
   - Provide "explanation": A concise, pedagogical explanation in Vietnamese explaining WHY the correct option fits the specific context and collocation.
   - Provide "exampleTranslation": A natural, accurate Vietnamese translation of the entire sentence (with the correct word filled in).
   - Provide "strongestDistractor": The most tempting incorrect option.
   - Provide "whyDistractorWrong": Clear explanation in Vietnamese explaining WHY that strongest distractor fails (e.g. wrong collocation, conflicting connotation, inappropriate register).
   - Provide "hint": A supportive clue that helps a struggling learner without directly giving away the word.

Target Question Count: Generate between 3 and ${Math.min(targetItemCount, 8)} questions, prioritized on lower SRS levels or weak words.

Output format: Return strict JSON only, matching this exact JSON schema:
{
  "questions": [
    {
      "id": "q_matching_vocabulary_id_1",
      "vocabularyId": "matching_vocabulary_id_from_input",
      "targetWord": "target_word",
      "questionType": "contextual_mcq",
      "difficulty": "challenging",
      "prompt": "Chọn từ hoặc cụm từ phù hợp nhất để hoàn thành câu sau:",
      "sentence": "After months of intensive negotiations, both parties finally ______ an agreement that addressed their primary concerns.",
      "options": ["reached", "achieved", "gained", "acquired"],
      "correctAnswerIndex": 0,
      "explanation": "Trong tiếng Anh thương mại và ngoại giao, cụm từ tự nhiên chuẩn mực là 'reach an agreement' (đạt được thỏa thuận).",
      "exampleTranslation": "Sau nhiều tháng đàm phán căng thẳng, cả hai bên cuối cùng đã đạt được một thỏa thuận giải quyết các mối quan ngại chính của họ.",
      "strongestDistractor": "achieved",
      "whyDistractorWrong": "'Achieve' thường đi với mục tiêu/thành tựu ('achieve a goal', 'achieve success'), không tạo thành collocation tự nhiên với 'an agreement'.",
      "hint": "Hãy chú ý đến động từ thường đi kèm với 'an agreement' để chỉ việc đạt được sau thương lượng."
    }
  ]
}

Input vocabulary list:
${vocabLines}
`;
}
