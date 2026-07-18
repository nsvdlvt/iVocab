"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import {
  communityCategorySchema,
  publishCommunityVocabularySchema,
} from "@/lib/validation/admin-community-vocabulary";

function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function extractVocabularySetIdFromShareUrl(input: string) {
  const value = input.trim();
  if (!value) return { error: "Please paste a vocabulary set share URL." as const };

  const match = value.match(/\/share\/(vs_[A-Za-z0-9_-]+)/) ?? value.match(/^(vs_[A-Za-z0-9_-]+)$/);
  const setId = match?.[1];
  if (!setId) return { error: "Invalid share URL." as const };
  return { setId };
}

export async function resolveCommunityVocabularySet(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const rawUrl = String(formData.get("vocabulary_set_url") ?? "");
  const parsed = extractVocabularySetIdFromShareUrl(rawUrl);

  if ("error" in parsed) {
    return { ok: false as const, error: parsed.error };
  }

  const setRow = await VocabSetRepository.getPublicVocabSetById(parsed.setId);
  if (!setRow) {
    return { ok: false as const, error: "Vocabulary set not found." };
  }

  const { count, error: countError } = await supabase
    .from("vocabularies")
    .select("id", { count: "exact", head: true })
    .eq("set_id", setRow.id);
  if (countError) throw countError;

  const { data: owner, error: ownerError } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", setRow.user_id)
    .maybeSingle();
  if (ownerError) throw ownerError;

  return {
    ok: true as const,
    vocabularySet: {
      id: setRow.id,
      title: setRow.title,
      description: setRow.description,
      visibility: setRow.visibility,
      wordCount: count ?? 0,
      ownerName: owner?.display_name ?? owner?.email ?? null,
      ownerEmail: owner?.email ?? null,
    },
  };
}

export async function createCommunityCategory(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const payload = communityCategorySchema.parse(formToObject(formData));

  const { error } = await supabase.from("community_categories").insert({
    name: payload.name,
    slug: payload.slug,
    description: payload.description || null,
    icon: payload.icon || null,
    color: payload.color || null,
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  });
  if (error) throw error;

  revalidatePath("/admin/community-vocabulary");
}

export async function updateCommunityCategory(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const raw = formToObject(formData);
  const id = String(raw.id ?? "");
  const payload = communityCategorySchema.parse(raw);

  const { error } = await supabase.from("community_categories").update({
    name: payload.name,
    slug: payload.slug,
    description: payload.description || null,
    icon: payload.icon || null,
    color: payload.color || null,
    sort_order: payload.sort_order,
    is_active: payload.is_active,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/community-vocabulary");
}

export async function toggleCommunityCategoryActive(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "false") === "true";

  const { error } = await supabase.from("community_categories").update({
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/community-vocabulary");
}

export async function reorderCommunityCategories(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const rawIds = String(formData.get("ids") ?? "");
  const ids = rawIds.split(",").map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) return;

  const updates = ids.map((id, index) =>
    supabase
      .from("community_categories")
      .update({
        sort_order: index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  revalidatePath("/admin/community-vocabulary");
}

export async function createCommunityVocabularyPublish(formData: FormData) {
  const { supabase, user } = await requirePermission("manageVocabulary");
  const payload = publishCommunityVocabularySchema.parse(formToObject(formData));

  const [
    { data: setRow, error: setError },
    { data: existing, error: existingError },
    { data: latestEntry, error: latestError },
  ] = await Promise.all([
    supabase.from("vocab_sets").select("title, description").eq("id", payload.vocabulary_set_id).single(),
    supabase
      .from("community_vocabulary_sets")
      .select("id")
      .eq("vocabulary_set_id", payload.vocabulary_set_id)
      .eq("community_category_id", payload.community_category_id)
      .maybeSingle(),
    supabase
      .from("community_vocabulary_sets")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (setError) throw setError;
  if (existingError) throw existingError;
  if (latestError) throw latestError;
  if (existing) throw new Error("Bộ từ vựng này đã được xuất bản trong danh mục đã chọn.");

  const nextSortOrder = (latestEntry?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("community_vocabulary_sets").insert({
    vocabulary_set_id: payload.vocabulary_set_id,
    community_category_id: payload.community_category_id,
    title_snapshot: setRow.title,
    description_snapshot: setRow.description ?? null,
    cover_image: payload.cover_image || null,
    difficulty: "beginner",
    estimated_minutes: null,
    sort_order: nextSortOrder,
    is_featured: false,
    is_active: true,
    published_by: user.id,
  });
  if (error) throw error;

  revalidatePath("/admin/community-vocabulary");
}

export async function updateCommunityVocabularyVisibility(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "false") === "true";
  const isFeatured = String(formData.get("is_featured") ?? "false") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  const { error } = await supabase.from("community_vocabulary_sets").update({
    is_active: isActive,
    is_featured: isFeatured,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/community-vocabulary");
}

export async function deleteCommunityVocabularyPublish(formData: FormData) {
  const { supabase } = await requirePermission("manageVocabulary");
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("community_vocabulary_sets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/community-vocabulary");
}
