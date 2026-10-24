import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SaveWordRequestSchema } from "@/types/dictionary";
import { normalizeVocabularyWord } from "@/lib/validation/vocabulary-duplicates";
import { normalizeIpa } from "@/lib/dictionary/phonetics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để xem danh sách bộ từ." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkWord = searchParams.get("checkWord")?.trim();
    const targetSetId = searchParams.get("setId")?.trim();

    // If checking duplicate for a specific set and word
    if (checkWord && targetSetId) {
      const { data: words, error } = await supabase
        .from("vocabularies")
        .select("id, word, meaning, part_of_speech")
        .eq("set_id", targetSetId)
        .eq("owner_id", user.id)
        .is("deleted_at", null);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const normalized = normalizeVocabularyWord(checkWord);
      const existing = (words || []).find(
        (w) => normalizeVocabularyWord(w.word) === normalized
      );

      return NextResponse.json({
        success: true,
        isDuplicate: Boolean(existing),
        existingWord: existing || null,
      });
    }

    // Default: return user's active vocabulary sets
    const { data: sets, error } = await supabase
      .from("vocab_sets")
      .select("id, title, color, icon, description, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sets: sets || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi hệ thống.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để lưu từ vựng vào bộ từ." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = SaveWordRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMsg = firstIssue
        ? `${firstIssue.message}${firstIssue.path.length ? ` (${firstIssue.path.join(".")})` : ""}`
        : "Dữ liệu lưu từ không hợp lệ.";
      return NextResponse.json(
        {
          success: false,
          error: `Dữ liệu lưu từ không hợp lệ: ${errorMsg}`,
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      setId,
      word,
      meaning,
      partOfSpeech,
      ipa,
      example,
      exampleTranslation,
      synonyms,
      forceUpdate,
    } = parsed.data;

    // Verify user owns the set
    const { data: setDoc, error: setError } = await supabase
      .from("vocab_sets")
      .select("id, title")
      .eq("id", setId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (setError || !setDoc) {
      return NextResponse.json(
        { success: false, error: "Bộ từ không tồn tại hoặc bạn không có quyền thêm từ vào bộ này." },
        { status: 404 }
      );
    }

    // Check for existing duplicate in set
    const normalizedWord = normalizeVocabularyWord(word);
    const { data: existingWords, error: checkError } = await supabase
      .from("vocabularies")
      .select("id, word, meaning, part_of_speech")
      .eq("set_id", setId)
      .eq("owner_id", user.id)
      .is("deleted_at", null);

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    const duplicate = (existingWords || []).find(
      (w) => normalizeVocabularyWord(w.word) === normalizedWord
    );

    if (duplicate && !forceUpdate) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: `Từ "${duplicate.word}" đã có trong bộ từ "${setDoc.title}".`,
          existingWord: duplicate,
        },
        { status: 409 }
      );
    }

    const cleanIpa = ipa ? normalizeIpa(ipa) || ipa.trim() : null;

    if (duplicate && forceUpdate) {
      // Update existing word
      const { data: updated, error: updateError } = await supabase
        .from("vocabularies")
        .update({
          meaning,
          part_of_speech: partOfSpeech,
          ipa: cleanIpa,
          example: example || null,
          example_translation: exampleTranslation || null,
          synonyms: synonyms.length > 0 ? synonyms : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", duplicate.id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        updated: true,
        wordId: updated.id,
        message: `Đã cập nhật từ "${word}" trong bộ từ "${setDoc.title}".`,
      });
    }

    // Insert new word
    const { data: inserted, error: insertError } = await supabase
      .from("vocabularies")
      .insert({
        set_id: setId,
        owner_id: user.id,
        word: word.trim(),
        meaning: meaning.trim(),
        part_of_speech: partOfSpeech,
        ipa: cleanIpa,
        example: example || null,
        example_translation: exampleTranslation || null,
        synonyms: synonyms.length > 0 ? synonyms : null,
        source: "manual",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    // Touch the vocab_set updated_at timestamp
    await supabase
      .from("vocab_sets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", setId);

    return NextResponse.json({
      success: true,
      created: true,
      wordId: inserted.id,
      message: `Đã lưu từ "${word}" vào bộ từ "${setDoc.title}"!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi lưu từ vựng.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
