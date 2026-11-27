import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { LearningProgressService } from "@/lib/statistics/learning-progress.service";
import { normalizeWordKey } from "@/lib/personal-test/vocabulary-selection";

const RequestSchema = z.object({
  setIndex: z.number().int().min(0),
  vocabularyIds: z.array(z.string()).default([]),
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PromotedLearnWordResult {
  vocabularyId: string;
  word: string;
  previousLevel: number;
  nextLevel: number;
  gainedLevel: boolean;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: testId } = await context.params;
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { setIndex, vocabularyIds } = parsed.data;
    const test = await PersonalTestRepository.getPersonalTestById(testId, user.id);

    if (!test) {
      return NextResponse.json(
        { success: false, error: "Personal test not found" },
        { status: 404 }
      );
    }

    const targetSet = test.content.sets[setIndex];
    if (!targetSet) {
      return NextResponse.json(
        { success: false, error: "Set not found in Personal Test" },
        { status: 404 }
      );
    }

    const uuidCandidates = Array.from(
      new Set(vocabularyIds.map((id) => id.trim()).filter((id) => UUID_REGEX.test(id)))
    );

    const verifiedRows: Array<{ id: string; word: string; set_id: string }> = [];
    const seenIds = new Set<string>();

    if (uuidCandidates.length > 0) {
      const { data: rowsById, error: byIdError } = await supabase
        .from("vocabularies")
        .select("id, word, set_id, vocab_sets!inner(user_id, deleted_at)")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .eq("vocab_sets.user_id", user.id)
        .is("vocab_sets.deleted_at", null)
        .in("id", uuidCandidates);

      if (byIdError) {
        throw new Error(byIdError.message);
      }

      for (const row of rowsById ?? []) {
        if (!seenIds.has(row.id)) {
          seenIds.add(row.id);
          verifiedRows.push({ id: row.id, word: row.word, set_id: row.set_id });
        }
      }
    }

    // Fallback: if any target words in the Set lacked passed UUIDs, resolve owned DB records by normalized word
    const coveredWords = new Set(verifiedRows.map((r) => normalizeWordKey(r.word)));
    const uncoveredWords = targetSet.words
      .map((w) => normalizeWordKey(w))
      .filter((w) => Boolean(w) && !coveredWords.has(w));

    if (uncoveredWords.length > 0) {
      const uncoveredSet = new Set(uncoveredWords);
      const { data: userVocabRows, error: userVocabError } = await supabase
        .from("vocabularies")
        .select("id, word, set_id, vocab_sets!inner(user_id, deleted_at)")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .eq("vocab_sets.user_id", user.id)
        .is("vocab_sets.deleted_at", null);

      if (userVocabError) {
        throw new Error(userVocabError.message);
      }

      for (const row of userVocabRows ?? []) {
        const norm = normalizeWordKey(row.word);
        if (uncoveredSet.has(norm) && !seenIds.has(row.id)) {
          seenIds.add(row.id);
          coveredWords.add(norm);
          verifiedRows.push({ id: row.id, word: row.word, set_id: row.set_id });
        }
      }
    }

    const promotedWords: PromotedLearnWordResult[] = [];
    let gainedCount = 0;

    for (const row of verifiedRows) {
      const result = await ReviewRepository.promoteVocabularyLevelForPersonalTestLearn({
        userId: user.id,
        vocabularyId: row.id,
      });

      if (result.gainedLevel) {
        gainedCount += 1;
      }

      promotedWords.push({
        vocabularyId: row.id,
        word: row.word,
        previousLevel: result.previousLevel,
        nextLevel: result.nextLevel,
        gainedLevel: result.gainedLevel,
      });
    }

    if (gainedCount > 0) {
      await LearningProgressService.recordActivity(user.id, gainedCount, 0, "learn").catch(
        (err) => {
          console.warn("[personal-test/learn-complete] recordActivity error:", err);
        }
      );
    }

    // Touch last_studied_at once per distinct set_id
    const touchedVocabBySet = new Map<string, string>();
    for (const row of verifiedRows) {
      if (!touchedVocabBySet.has(row.set_id)) {
        touchedVocabBySet.set(row.set_id, row.id);
      }
    }
    await Promise.allSettled(
      Array.from(touchedVocabBySet.values()).map((vocabId) =>
        VocabSetRepository.touchLastStudiedAtByVocabularyId(vocabId, user.id)
      )
    );

    revalidatePath("/u/review");
    revalidatePath("/u");
    revalidatePath("/u/vocabulary");

    return NextResponse.json({
      success: true,
      data: {
        setIndex,
        promotedWords,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server Error";
    console.error("[api/personal-test/[id]/learn-complete] error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
