"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Eye } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createReadingArticleAction, updateReadingArticleAction } from "@/actions/admin/reading";
import { toast } from "sonner";
import { ReadingArticleRow } from "@/repositories/admin/reading.repository";

interface ParagraphItem {
  id: string;
  enText: string;
  viText: string;
}

interface ArticleEditorClientProps {
  initialArticle?: ReadingArticleRow | null;
}

export function ArticleEditorClient({ initialArticle }: ArticleEditorClientProps) {
  const router = useRouter();
  const isEditing = Boolean(initialArticle);

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [description, setDescription] = useState(initialArticle?.description || "");
  const [topic, setTopic] = useState(initialArticle?.topic || "technology");
  const [level, setLevel] = useState(initialArticle?.level || "Intermediate (B1-B2)");
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialArticle?.estimated_reading_minutes || 5);
  const [status, setStatus] = useState<"draft" | "published">(initialArticle?.status || "draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize paragraphs
  const initialParagraphs: ParagraphItem[] = (() => {
    if (!initialArticle) {
      return [{ id: "p1", enText: "", viText: "" }];
    }

    const enRaw = initialArticle.english_content as any;
    const viRaw = initialArticle.vietnamese_content as any;
    const enParagraphs = Array.isArray(enRaw?.paragraphs) ? enRaw.paragraphs : [];
    const viParagraphs = Array.isArray(viRaw?.paragraphs) ? viRaw.paragraphs : [];

    if (enParagraphs.length === 0) {
      return [{ id: "p1", enText: "", viText: "" }];
    }

    return enParagraphs.map((enP: any, index: number) => {
      const viP = viParagraphs[index] || viParagraphs.find((v: any) => v.id === enP.id);
      return {
        id: enP.id || `p${index + 1}`,
        enText: typeof enP === "string" ? enP : enP.text || "",
        viText: typeof viP === "string" ? viP : viP?.text || "",
      };
    });
  })();

  const [paragraphs, setParagraphs] = useState<ParagraphItem[]>(initialParagraphs);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slug) {
      setSlug(generateSlug(val));
    }
  };

  const addParagraph = () => {
    const nextId = `p${paragraphs.length + 1}`;
    setParagraphs([...paragraphs, { id: nextId, enText: "", viText: "" }]);
  };

  const removeParagraph = (index: number) => {
    if (paragraphs.length <= 1) {
      toast.error("Bài đọc cần ít nhất 1 đoạn văn");
      return;
    }
    setParagraphs(paragraphs.filter((_, i) => i !== index));
  };

  const updateParagraph = (index: number, field: "enText" | "viText", val: string) => {
    const updated = [...paragraphs];
    updated[index][field] = val;
    setParagraphs(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài đọc");
      return;
    }
    if (!slug.trim()) {
      toast.error("Vui lòng nhập đường dẫn (slug)");
      return;
    }

    const englishContent = {
      paragraphs: paragraphs.map((p) => ({
        id: p.id,
        text: p.enText.trim(),
      })),
    };

    const vietnameseContent = {
      paragraphs: paragraphs.map((p) => ({
        id: p.id,
        text: p.viText.trim(),
      })),
    };

    setIsSubmitting(true);
    try {
      if (isEditing && initialArticle) {
        const res = await updateReadingArticleAction(initialArticle.id, {
          title,
          slug,
          description,
          topic,
          level,
          estimated_reading_minutes: estimatedMinutes,
          english_content: englishContent,
          vietnamese_content: vietnameseContent,
          status,
        });
        if (res.ok) {
          toast.success("Đã cập nhật bài đọc thành công");
          router.push("/admin/reading");
          router.refresh();
        } else {
          toast.error("Không thể lưu bài đọc");
        }
      } else {
        const res = await createReadingArticleAction({
          title,
          slug,
          description,
          topic,
          level,
          estimated_reading_minutes: estimatedMinutes,
          english_content: englishContent,
          vietnamese_content: vietnameseContent,
          status,
        });
        if (res.ok) {
          toast.success("Đã tạo bài đọc mới thành công");
          router.push("/admin/reading");
          router.refresh();
        } else {
          toast.error(res.error || "Không thể tạo bài đọc");
        }
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu bài đọc");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reading"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-9 w-9")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? `Chỉnh sửa: ${initialArticle?.title}` : "Tạo Bài đọc Song ngữ Mới"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Soạn thảo văn bản tiếng Anh và bản dịch tương ứng theo từng đoạn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <Link
              href={`/reading/${initialArticle?.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Xem trang đọc
            </Link>
          )}
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[#f9971d] hover:bg-[#e68512] text-[#030f31] font-bold"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật bài đọc" : "Lưu bài đọc mới"}
          </Button>
        </div>
      </div>

      {/* Metadata Form */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Thông tin Cơ bản của Bài đọc</CardTitle>
          <CardDescription className="text-xs">Tiêu đề, phân loại, chủ đề và thời gian đọc ước tính</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tiêu đề bài đọc (English Title) *</Label>
              <Input
                placeholder="VD: The Future of Renewable Energy..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Đường dẫn tĩnh (Slug) *</Label>
              <Input
                placeholder="the-future-of-renewable-energy"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả tóm tắt nội dung</Label>
            <Input
              placeholder="Tóm tắt ngắn gọn chủ đề và nội dung cốt lõi của bài đọc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Chủ đề (Topic)</Label>
              <Input
                placeholder="technology, science, life..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cấp độ (Level)</Label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Beginner (A1-A2)">Beginner (A1-A2)</option>
                <option value="Intermediate (B1-B2)">Intermediate (B1-B2)</option>
                <option value="Advanced (C1-C2)">Advanced (C1-C2)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái phát hành</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="draft">Bản nháp (Draft)</option>
                <option value="published">Xuất bản công khai (Published)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bilingual Paragraphs Editor */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Nội dung Song ngữ theo Đoạn ({paragraphs.length} đoạn)</CardTitle>
            <CardDescription className="text-xs">
              Mỗi đoạn tiếng Anh sẽ hiển thị song song với bản dịch tiếng Việt khi người học chuyển đổi
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addParagraph}>
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm đoạn mới
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {paragraphs.map((p, idx) => (
            <div key={p.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Đoạn {idx + 1} ({p.id})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParagraph(idx)}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Xóa đoạn
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Văn bản Tiếng Anh (English) *
                  </Label>
                  <Textarea
                    placeholder="Enter English paragraph content here..."
                    value={p.enText}
                    onChange={(e) => updateParagraph(idx, "enText", e.target.value)}
                    rows={4}
                    className="font-sans text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Bản dịch Tiếng Việt (Vietnamese) *
                  </Label>
                  <Textarea
                    placeholder="Nhập bản dịch đoạn văn tiếng Việt tương ứng..."
                    value={p.viText}
                    onChange={(e) => updateParagraph(idx, "viText", e.target.value)}
                    rows={4}
                    className="font-sans text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addParagraph} className="w-full h-14 border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Thêm đoạn văn tiếp theo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
