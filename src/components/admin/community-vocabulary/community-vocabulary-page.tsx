"use client";

import * as React from "react";
import { format } from "date-fns";
import { GripVertical, Pencil, Plus, Search, Sparkles, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createCommunityCategory,
  createCommunityVocabularyPublish,
  deleteCommunityVocabularyPublish,
  resolveCommunityVocabularySet,
  reorderCommunityCategories,
  toggleCommunityCategoryActive,
  updateCommunityCategory,
  updateCommunityVocabularyVisibility,
} from "@/app/(admin)/admin/community-vocabulary/actions";
import type {
  CommunityCategoryRow,
  CommunityVocabularySetRow,
  VocabularySetOption,
} from "@/repositories/admin/community-vocabulary.repository";

type SortDirection = "asc" | "desc";

interface CommunityVocabularyPageProps {
  categories: CommunityCategoryRow[];
  sets: CommunityVocabularySetRow[];
  publishableSets: VocabularySetOption[];
  page: number;
  pageSize: number;
  total: number;
  search: string;
  sort: string;
  order: SortDirection;
  hasDataLayerError?: boolean;
}

type ResolvedSet = {
  id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  wordCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
};

export function CommunityVocabularyPage({
  categories,
  sets,
  publishableSets,
  page,
  pageSize,
  total,
  search,
  sort,
  order,
  hasDataLayerError = false,
}: CommunityVocabularyPageProps) {
  const [orderedCategories, setOrderedCategories] = React.useState(() => categories);
  const [draggingCategoryId, setDraggingCategoryId] = React.useState<string | null>(null);
  const [isReordering, startReordering] = React.useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const persistCategoryOrder = React.useCallback((nextCategories: CommunityCategoryRow[]) => {
    const formData = new FormData();
    formData.set("ids", nextCategories.map((category) => category.id).join(","));
    startReordering(() => {
      void reorderCommunityCategories(formData);
    });
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community Vocabulary</h1>
            <p className="text-muted-foreground">
              Publish existing vocabulary sets into the community library and manage category metadata.
            </p>
          </div>
          <PublishVocabularyDialog categories={categories} publishableSets={publishableSets} />
        </div>
        {hasDataLayerError ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            Community tables could not be loaded. Apply the new database migration first, then refresh this page.
          </div>
        ) : null}
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Category Management</h2>
            <p className="text-sm text-muted-foreground">Categories will later become the Home page filters.</p>
          </div>
          <CategoryDialog triggerLabel="Create Category" />
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedCategories.length ? (
                orderedCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-t"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingCategoryId || draggingCategoryId === category.id) return;
                      const next = [...orderedCategories];
                      const sourceIndex = next.findIndex((item) => item.id === draggingCategoryId);
                      const targetIndex = next.findIndex((item) => item.id === category.id);
                      if (sourceIndex === -1 || targetIndex === -1) return;
                      const [moved] = next.splice(sourceIndex, 1);
                      next.splice(targetIndex, 0, moved);
                      setOrderedCategories(next);
                      setDraggingCategoryId(null);
                      persistCategoryOrder(next);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          draggable
                          onDragStart={() => setDraggingCategoryId(category.id)}
                          onDragEnd={() => setDraggingCategoryId(null)}
                          className="cursor-grab rounded-md border bg-muted/30 p-1 text-muted-foreground active:cursor-grabbing"
                          aria-label={`Drag ${category.name}`}
                          title="Drag to reorder"
                          disabled={isReordering}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">{category.description}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{category.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{category.sort_order}</td>
                    <td className="px-4 py-3">{format(new Date(category.updated_at), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <CategoryDialog triggerLabel="Edit" category={category} />
                        <form action={toggleCommunityCategoryActive}>
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="is_active" value={String(!category.is_active)} />
                          <Button variant="outline" size="sm" className="h-8 gap-1.5" type="submit">
                            {category.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                            {category.is_active ? "Disable" : "Enable"}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Community Vocabulary Table</h2>
            <p className="text-sm text-muted-foreground">Search, sort, and page through published community entries.</p>
          </div>
          <form className="flex flex-wrap items-center gap-2" method="get">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search title or description..."
              className="flex h-10 w-72 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <select
              name="sort"
              defaultValue={sort}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="created_at">Published At</option>
              <option value="sort_order">Sort Order</option>
              <option value="title_snapshot">Title</option>
              <option value="updated_at">Updated At</option>
            </select>
            <select
              name="order"
              defaultValue={order}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button variant="outline" type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">Cover</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Original Vocabulary Set</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Published At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sets.length ? (
                sets.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.title_snapshot}</div>
                      {item.description_snapshot ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description_snapshot}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{item.vocab_sets?.title ?? "-"}</td>
                    <td className="px-4 py-3">{item.community_categories?.name ?? "-"}</td>
                    <td className="px-4 py-3 capitalize">{item.difficulty}</td>
                    <td className="px-4 py-3">{item.is_featured ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{item.sort_order}</td>
                    <td className="px-4 py-3">{format(new Date(item.created_at), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <CommunityVisibilityDialog item={item} />
                        <form action={deleteCommunityVocabularyPublish}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive" type="submit">
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    No community vocabulary has been published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <PageLink page={Math.max(1, page - 1)} label="Previous" disabled={page <= 1} search={search} sort={sort} order={order} />
            <PageLink page={Math.min(totalPages, page + 1)} label="Next" disabled={page >= totalPages} search={search} sort={sort} order={order} />
          </div>
        </div>
      </section>
    </div>
  );
}

function PageLink({
  page,
  label,
  disabled,
  search,
  sort,
  order,
}: {
  page: number;
  label: string;
  disabled: boolean;
  search: string;
  sort: string;
  order: SortDirection;
}) {
  return (
    <a
      href={`?page=${page}&search=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}&order=${order}`}
      aria-disabled={disabled}
      className={buttonVariants({ variant: "outline", size: "sm", className: disabled ? "pointer-events-none opacity-50" : "" })}
    >
      {label}
    </a>
  );
}

function CategoryDialog({
  triggerLabel,
  category,
  compact = false,
}: {
  triggerLabel: string;
  category?: CommunityCategoryRow;
  compact?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={category ? "ghost" : "outline"} size={compact ? "icon-sm" : "sm"} className={compact ? "" : "gap-2"} />}>
        {category ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {!compact ? triggerLabel : null}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>Manage category metadata used by the future Home page filters.</DialogDescription>
        </DialogHeader>
        <form action={category ? updateCommunityCategory : createCommunityCategory} className="space-y-4">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" name="name" defaultValue={category?.name} />
            <Field label="Slug" name="slug" defaultValue={category?.slug} />
          </div>
          <TextareaField label="Description" name="description" defaultValue={category?.description ?? ""} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Icon" name="icon" defaultValue={category?.icon ?? ""} />
            <Field label="Color" name="color" defaultValue={category?.color ?? ""} />
            <Field label="Sort Order" name="sort_order" type="number" defaultValue={String(category?.sort_order ?? 0)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="h-4 w-4" />
            <Label>Active</Label>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{category ? "Save Changes" : "Create Category"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PublishVocabularyDialog({
  categories,
  publishableSets,
}: {
  categories: CommunityCategoryRow[];
  publishableSets: VocabularySetOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");
  const [resolvedSet, setResolvedSet] = React.useState<ResolvedSet | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isResolving, startResolving] = React.useTransition();
  const [isPublishing, startPublishing] = React.useTransition();

  const resolveUrl = React.useCallback(async (url: string) => {
    const formData = new FormData();
    formData.set("vocabulary_set_url", url);
    const result = await resolveCommunityVocabularySet(formData);
    if (result.ok) {
      setResolvedSet(result.vocabularySet);
      setResolveError(null);
      return;
    }
    setResolvedSet(null);
    setResolveError(result.error ?? "Vocabulary set not found.");
  }, []);

  const resetDialog = React.useCallback(() => {
    setShareUrl("");
    setResolvedSet(null);
    setResolveError(null);
    setSubmitError(null);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetDialog();
      }
    },
    [resetDialog]
  );

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);

      if (!resolvedSet) {
        setSubmitError("Please load a valid vocabulary set first.");
        return;
      }

      const formData = new FormData(event.currentTarget);
      startPublishing(() => {
        void (async () => {
          try {
            await createCommunityVocabularyPublish(formData);
            handleOpenChange(false);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to publish vocabulary set.");
          }
        })();
      });
    },
    [handleOpenChange, resolvedSet]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Publish Vocabulary Set
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish Vocabulary Set</DialogTitle>
          <DialogDescription>Paste a share URL, review the preview, then publish the set into the community library.</DialogDescription>
        </DialogHeader>
        {categories.length === 0 ? (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            You need at least one community category before publishing.
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="vocabulary_set_id" value={resolvedSet?.id ?? ""} />
          <div className="grid gap-2">
            <Label htmlFor="vocabulary_set_url">Vocabulary Set URL</Label>
            <div className="flex items-end gap-2">
              <input
                id="vocabulary_set_url"
                name="vocabulary_set_url"
                value={shareUrl}
                onChange={(event) => {
                  setShareUrl(event.target.value);
                  setResolvedSet(null);
                  setResolveError(null);
                }}
                onBlur={() => {
                  if (!shareUrl.trim()) return;
                  startResolving(() => {
                    void resolveUrl(shareUrl);
                  });
                }}
                placeholder="https://vocabee.com/share/vs_xxxxxxxxx"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => startResolving(() => void resolveUrl(shareUrl))}
                disabled={isResolving || !shareUrl.trim()}
              >
                {isResolving ? "Loading..." : "Load"}
              </Button>
            </div>
            {resolveError ? <p className="text-sm text-destructive">{resolveError}</p> : null}
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            {resolvedSet ? (
              <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <div className="font-medium">? {resolvedSet.title}</div>
                <div className="text-muted-foreground">{resolvedSet.wordCount} words</div>
                <div className="text-muted-foreground capitalize">{resolvedSet.visibility ?? "private"}</div>
                {resolvedSet.ownerName ? <div className="text-muted-foreground">Owner: {resolvedSet.ownerName}</div> : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Community Category</Label>
              <CategoryDialog triggerLabel="+" compact />
            </div>
            <select
              name="community_category_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select community category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <input type="hidden" name="is_featured" value="false" />
          <input type="hidden" name="is_active" value="true" />

          <div className="flex justify-end">
            <Button type="submit" disabled={!resolvedSet || categories.length === 0 || publishableSets.length === 0 || isPublishing}>
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CommunityVisibilityDialog({ item }: { item: CommunityVocabularySetRow }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 gap-1.5" />}>
        <Pencil className="h-4 w-4" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Community Entry</DialogTitle>
          <DialogDescription>Adjust featured state, activity, and sorting.</DialogDescription>
        </DialogHeader>
        <form action={updateCommunityVocabularyVisibility} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <Field label="Sort Order" name="sort_order" type="number" defaultValue={String(item.sort_order)} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_featured" defaultChecked={item.is_featured} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" defaultChecked={item.is_active} />
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={4} />
    </div>
  );
}
