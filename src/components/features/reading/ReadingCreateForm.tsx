"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { readingCreateSchema, readingLevels, readingTopics, parseParagraphDrafts, slugifyReadingTitle } from "@/lib/reading/reading-editor";

const STORAGE_BUCKET = "reading-covers";

type ReadingCreateState = {
  title: string;
  description: string;
  topic: string;
  level: (typeof readingLevels)[number];
  estimatedReadingMinutes: string;
  vocabularyCount: string;
  englishContent: string;
  vietnameseContent: string;
};

export function ReadingCreateForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ReadingCreateState>({
    title: "",
    description: "",
    topic: "Technology",
    level: "B1",
    estimatedReadingMinutes: "6",
    vocabularyCount: "20",
    englishContent: "",
    vietnameseContent: "",
  });

  const englishParagraphs = React.useMemo(() => parseParagraphDrafts(state.englishContent), [state.englishContent]);
  const vietnameseParagraphs = React.useMemo(() => parseParagraphDrafts(state.vietnameseContent), [state.vietnameseContent]);

  const canPublish =
    state.title.trim().length > 0 &&
    state.topic.trim().length > 0 &&
    englishParagraphs.length > 0 &&
    englishParagraphs.length === vietnameseParagraphs.length &&
    !submitting;

  const handleImageUpload = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setError("Bạn cần đăng nhập lại.");
      return;
    }

    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
      setUploadedPath(null);
    }

    const path = `${authData.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setPreviewUrl(data.publicUrl);
    setUploadedPath(path);
  };

  const handleRemoveImage = async () => {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
    }
    setPreviewUrl(null);
    setUploadedPath(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = readingCreateSchema.safeParse({
      ...state,
      coverImageUrl: previewUrl ?? "",
      estimatedReadingMinutes: state.estimatedReadingMinutes,
      vocabularyCount: state.vocabularyCount,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
      return;
    }

    if (englishParagraphs.length !== vietnameseParagraphs.length) {
      setError("Số đoạn tiếng Anh và tiếng Việt phải bằng nhau.");
      return;
    }

    setSubmitting(true);
    try {
      const slug = slugifyReadingTitle(parsed.data.title);
      const english_content = {
        paragraphs: englishParagraphs.map((paragraph, index) => ({
          id: paragraph.id,
          text: paragraph.text,
        })),
      };
      const vietnamese_content = {
        paragraphs: vietnameseParagraphs.map((paragraph, index) => ({
          id: `p${index + 1}`,
          text: paragraph.text,
        })),
      };

      const { error: insertError } = await supabase.from("reading_articles").insert({
        slug,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        cover_image_url: previewUrl,
        topic: parsed.data.topic,
        level: parsed.data.level,
        estimated_reading_minutes: Number(parsed.data.estimatedReadingMinutes),
        vocabulary_count: Number(parsed.data.vocabularyCount),
        english_content,
        vietnamese_content,
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      router.push(`/reading/${slug}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể lưu bài đọc.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
        <div className="space-y-6 p-5 sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input id="title" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} placeholder="The Rise of Smart Cities" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={state.level} onValueChange={(value) => setState((s) => ({ ...s, level: value as ReadingCreateState["level"] }))}>
                    <SelectTrigger id="level" className="w-full">
                      <SelectValue placeholder="Chọn level" />
                    </SelectTrigger>
                    <SelectContent>
                      {readingLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="topic">Chủ đề</Label>
                  <Select value={state.topic} onValueChange={(value) => setState((s) => ({ ...s, topic: value ?? s.topic }))}>
                    <SelectTrigger id="topic" className="w-full">
                      <SelectValue placeholder="Chọn chủ đề" />
                    </SelectTrigger>
                    <SelectContent>
                      {readingTopics.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimatedReadingMinutes">Thời gian đọc</Label>
                  <Input
                    id="estimatedReadingMinutes"
                    type="number"
                    min={1}
                    max={60}
                    value={state.estimatedReadingMinutes}
                    onChange={(e) => setState((s) => ({ ...s, estimatedReadingMinutes: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vocabularyCount">Số từ vựng</Label>
                  <Input
                    id="vocabularyCount"
                    type="number"
                    min={0}
                    max={500}
                    value={state.vocabularyCount}
                    onChange={(e) => setState((s) => ({ ...s, vocabularyCount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Tóm tắt ngắn gọn về bài đọc."
                  className="min-h-24"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cover image</Label>
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img src={previewUrl} alt="Cover preview" className="h-48 w-full rounded-xl object-cover" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                        <Trash2 className="h-4 w-4" />
                        Xóa ảnh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 text-center">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Tải ảnh bìa lên</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">BÀI ĐỌC TIẾNG ANH</div>
            <Textarea
              value={state.englishContent}
              onChange={(e) => setState((s) => ({ ...s, englishContent: e.target.value }))}
              className="min-h-[28rem] text-base leading-7"
              placeholder={"Paragraph 1...\n\nParagraph 2...\n\nParagraph 3..."}
            />
            <p className="mt-2 text-xs text-muted-foreground">Mỗi đoạn cách nhau bằng một dòng trống.</p>
            <p className="mt-2 text-xs text-muted-foreground">Đã nhận: {englishParagraphs.length} đoạn</p>
          </div>
          <div className="p-5 lg:p-6">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">NGHĨA TIẾNG VIỆT</div>
            <Textarea
              value={state.vietnameseContent}
              onChange={(e) => setState((s) => ({ ...s, vietnameseContent: e.target.value }))}
              className="min-h-[28rem] text-base leading-7"
              placeholder={"Đoạn 1...\n\nĐoạn 2...\n\nĐoạn 3..."}
            />
            <p className="mt-2 text-xs text-muted-foreground">Mỗi đoạn phải khớp thứ tự với bản tiếng Anh.</p>
            <p className="mt-2 text-xs text-muted-foreground">Đã nhận: {vietnameseParagraphs.length} đoạn</p>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canPublish} className="min-w-40 rounded-full px-6">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đăng...
            </>
          ) : (
            "Xuất bản bài đọc"
          )}
        </Button>
      </div>
    </form>
  );
}
