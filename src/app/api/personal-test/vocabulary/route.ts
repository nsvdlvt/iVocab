import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PersonalTestRepository } from "@/repositories/personal-test.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Vui lòng đăng nhập để tiếp tục." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const setIdsParam = searchParams.get("setIds");

    if (setIdsParam !== null) {
      const setIds = Array.from(
        new Set(
          setIdsParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        )
      ).slice(0, 50);

      if (setIds.length === 0) {
        return NextResponse.json({ success: true, words: [] });
      }

      const words = await PersonalTestRepository.getUserSelectableWordsBySetIds(
        user.id,
        setIds
      );
      return NextResponse.json({ success: true, words });
    }

    const sets = await PersonalTestRepository.getUserSelectableVocabSets(user.id);
    return NextResponse.json({ success: true, sets });
  } catch (error) {
    console.error("[API personal-test/vocabulary] Error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải dữ liệu từ vựng. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
