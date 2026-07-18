import { z } from "zod";

export const communityCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug phải là kebab-case"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(80).optional().or(z.literal("")),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.coerce.boolean(),
});

export const publishCommunityVocabularySchema = z.object({
  vocabulary_set_id: z.string().trim().regex(/^vs_[A-Za-z0-9_-]+$/, "Invalid vocabulary set id"),
  community_category_id: z.string().uuid(),
  cover_image: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CommunityCategoryFormValues = z.infer<typeof communityCategorySchema>;
export type PublishCommunityVocabularyFormValues = z.infer<typeof publishCommunityVocabularySchema>;
