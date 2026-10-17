"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminReadingRepository } from "@/repositories/admin/reading.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";
import { Json } from "@/types/database";

export async function createReadingArticleAction(payload: {
  slug: string;
  title: string;
  description?: string;
  topic: string;
  level: string;
  estimated_reading_minutes?: number;
  english_content: Json;
  vietnamese_content: Json;
  status: "draft" | "published";
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { user } = await assertAdmin();

    if (!payload.title || !payload.slug) {
      return { ok: false, error: "Tiêu đề và đường dẫn (slug) không được để trống" };
    }

    const created = await AdminReadingRepository.createArticle({
      ...payload,
      vocabulary_count: 0,
    });

    await AdminAuditRepository.logAction(
      "create_reading_article",
      "reading_article",
      created.id,
      { title: created.title, status: created.status, createdBy: user.email }
    );

    revalidatePath("/admin/reading");
    return { ok: true, id: created.id };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateReadingArticleAction(
  articleId: string,
  payload: {
    slug?: string;
    title?: string;
    description?: string;
    topic?: string;
    level?: string;
    estimated_reading_minutes?: number;
    english_content?: Json;
    vietnamese_content?: Json;
    status?: "draft" | "published";
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminReadingRepository.updateArticle(articleId, payload);

    await AdminAuditRepository.logAction(
      "update_reading_article",
      "reading_article",
      articleId,
      { title: payload.title, status: payload.status, updatedBy: user.email }
    );

    revalidatePath("/admin/reading");
    revalidatePath(`/admin/reading/${articleId}`);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function toggleReadingArticleStatusAction(
  articleId: string,
  status: "draft" | "published"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminReadingRepository.updateArticle(articleId, { status });

    await AdminAuditRepository.logAction(
      "toggle_reading_status",
      "reading_article",
      articleId,
      { newStatus: status, updatedBy: user.email }
    );

    revalidatePath("/admin/reading");
    revalidatePath(`/admin/reading/${articleId}`);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteReadingArticleAction(articleId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    await AdminReadingRepository.deleteArticle(articleId);

    await AdminAuditRepository.logAction(
      "delete_reading_article",
      "reading_article",
      articleId,
      { deletedBy: user.email }
    );

    revalidatePath("/admin/reading");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
