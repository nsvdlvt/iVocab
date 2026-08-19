import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedColors = new Set(["yellow", "green", "blue", "pink", "purple"]);
const allowedLanguages = new Set(["en", "vi"]);

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ highlights: [] }, { status: 200 });
  }

  const articleId = new URL(request.url).searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ highlights: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("reading_highlights")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    highlights: data ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    articleId?: string;
    paragraphId?: string;
    language?: string;
    selectedText?: string;
    color?: string;
  };

  if (!body.articleId || !body.paragraphId || !body.language || !body.selectedText || !body.color) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!allowedLanguages.has(body.language) || !allowedColors.has(body.color)) {
    return NextResponse.json({ error: "Invalid highlight payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reading_highlights")
    .upsert(
      {
        user_id: userData.user.id,
        article_id: body.articleId,
        paragraph_id: body.paragraphId,
        language: body.language as "en" | "vi",
        selected_text: body.selectedText.trim(),
        color: body.color as "yellow" | "green" | "blue" | "pink" | "purple",
      },
      { onConflict: "user_id,article_id,paragraph_id,language,selected_text" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ highlight: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    articleId?: string;
    paragraphId?: string;
    language?: string;
    selectedText?: string;
    color?: string;
  };

  if (!body.articleId || !body.paragraphId || !body.language || !body.selectedText || !body.color) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reading_highlights")
    .update({ color: body.color as "yellow" | "green" | "blue" | "pink" | "purple" })
    .eq("user_id", userData.user.id)
    .eq("article_id", body.articleId)
    .eq("paragraph_id", body.paragraphId)
    .eq("language", body.language as "en" | "vi")
    .eq("selected_text", body.selectedText.trim())
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ highlight: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    articleId?: string;
    paragraphId?: string;
    language?: string;
    selectedText?: string;
  };

  if (!body.articleId || !body.paragraphId || !body.language || !body.selectedText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("reading_highlights")
    .delete()
    .eq("user_id", userData.user.id)
    .eq("article_id", body.articleId)
    .eq("paragraph_id", body.paragraphId)
    .eq("language", body.language as "en" | "vi")
    .eq("selected_text", body.selectedText.trim());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
