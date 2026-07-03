"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { vocabSetSchema } from "@/lib/validators/vocab-set";
import { createVocabularySet } from "@/actions/vocab-sets/create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "@/components/common/SectionCard";
import { toast } from "sonner";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Plus, Trash2, BookOpen } from "lucide-react";

// 1. Zod Validation schema for Vocabulary Item in Form
const vocabularyItemFormSchema = z.object({
  word: z.string().min(1, "Từ vựng không được để trống"),
  meaning: z.string().min(1, "Nghĩa không được để trống"),
  ipa: z.string().optional().or(z.literal("")),
  partOfSpeech: z.string().optional().or(z.literal("")),
  example: z.string().optional().or(z.literal("")),
  synonyms: z.string().optional().or(z.literal("")),
});

// 2. Extend vocabulary set schema with optional array of items
const newVocabSetFormSchema = vocabSetSchema.extend({
  words: z.array(vocabularyItemFormSchema).optional(),
});

type NewVocabSetFormValues = z.infer<typeof newVocabSetFormSchema>;

export function NewVocabSetForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<NewVocabSetFormValues>({
    resolver: zodResolver(newVocabSetFormSchema),
    defaultValues: {
      title: "",
      description: "",
      source_language: "en",
      target_language: "vi",
      color: "",
      icon: "",
      visibility: "private",
      words: [],
    },
  });

  // Dynamic Array for Vocabulary Items
  const { fields, append, remove } = useFieldArray({
    control,
    name: "words",
  });

  const [visibility, setVisibility] = useState<NewVocabSetFormValues["visibility"]>("private");

  const onSubmit = async (data: NewVocabSetFormValues) => {
    setIsPending(true);
    try {
      const vocabSetData = {
        title: data.title,
        description: data.description,
        source_language: data.source_language,
        target_language: data.target_language,
        color: data.color,
        icon: data.icon,
        visibility: data.visibility,
      };

      const res = await createVocabularySet(vocabSetData, data.words);
      if (res.success && res.setId) {
        toast.success("Tạo bộ từ vựng mới thành công!");
        router.push(ROUTES.VOCABULARY_DETAIL(res.setId));
      } else {
        toast.error(res.error || "Không thể tạo bộ từ vựng.");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsPending(false);
    }
  };

  const visibilityOptions = [
    { label: "Riêng tư", value: "private" as const },
    { label: "Không công khai", value: "unlisted" as const },
    { label: "Công khai", value: "public" as const },
  ];

  const partOfSpeechOptions = [
    { label: "Danh từ", value: "noun" },
    { label: "Động từ", value: "verb" },
    { label: "Tính từ", value: "adjective" },
    { label: "Trạng từ", value: "adverb" },
    { label: "Giới từ", value: "preposition" },
    { label: "Liên từ", value: "conjunction" },
    { label: "Đại từ", value: "pronoun" },
    { label: "Thán từ", value: "interjection" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* SECTION 1: Thông tin bộ từ */}
      <SectionCard className="shadow-xs border-border/80 p-8 rounded-2xl space-y-6">
        <h2 className="text-base font-bold text-foreground pb-2 border-b border-border/40">
          Thông tin bộ từ vựng
        </h2>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs font-semibold">Tên bộ từ vựng *</Label>
          <Input
            id="title"
            placeholder="Ví dụ: IELTS Vocabulary, Oxford 3000..."
            {...register("title")}
            disabled={isPending}
            className="h-10 text-xs rounded-xl"
          />
          {errors.title && <p className="text-xs text-rose-500 font-medium">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs font-semibold">Mô tả (Không bắt buộc)</Label>
          <Input
            id="description"
            placeholder="Mô tả ngắn gọn về mục tiêu học hoặc chủ đề bộ từ vựng..."
            {...register("description")}
            disabled={isPending}
            className="h-10 text-xs rounded-xl"
          />
          {errors.description && <p className="text-xs text-rose-500 font-medium">{errors.description.message}</p>}
        </div>

        {/* Languages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source_language" className="text-xs font-semibold">Ngôn ngữ gốc</Label>
            <Select defaultValue="en" onValueChange={(val) => setValue("source_language", val || "en")} disabled={isPending}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Chọn ngôn ngữ gốc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">Tiếng Anh (EN)</SelectItem>
                <SelectItem value="vi">Tiếng Việt (VI)</SelectItem>
                <SelectItem value="ja">Tiếng Nhật (JA)</SelectItem>
                <SelectItem value="ko">Tiếng Hàn (KO)</SelectItem>
              </SelectContent>
            </Select>
            {errors.source_language && <p className="text-xs text-rose-500 font-medium">{errors.source_language.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_language" className="text-xs font-semibold">Ngôn ngữ dịch</Label>
            <Select defaultValue="vi" onValueChange={(val) => setValue("target_language", val || "vi")} disabled={isPending}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Chọn ngôn ngữ dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt (VI)</SelectItem>
                <SelectItem value="en">Tiếng Anh (EN)</SelectItem>
              </SelectContent>
            </Select>
            {errors.target_language && <p className="text-xs text-rose-500 font-medium">{errors.target_language.message}</p>}
          </div>
        </div>

        {/* Visibility (Segmented Control) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Trạng thái hiển thị</Label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 border rounded-xl max-w-md">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setValue("visibility", opt.value);
                  setVisibility(opt.value);
                }}
                disabled={isPending}
                className={cn(
                  "py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                  visibility === opt.value
                    ? "bg-background text-foreground shadow-xs border border-border/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.visibility && <p className="text-xs text-rose-500 font-medium">{errors.visibility.message}</p>}
        </div>
      </SectionCard>

      {/* SECTION 2: Vocabulary */}
      <SectionCard className="shadow-xs border-border/80 p-8 rounded-2xl space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-border/40">
          <h2 className="text-base font-bold text-foreground">
            Từ vựng
          </h2>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-lg border">
            {fields.length} từ
          </span>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative p-5 border border-border/60 bg-muted/5 dark:bg-muted/10 rounded-2xl space-y-4 transition-all hover:border-border"
              >
                {/* Block header */}
                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                  <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    TỪ VỰNG CHI TIẾT
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Xóa từ
                  </Button>
                </div>

                {/* Input Fields Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Word */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Từ vựng *</Label>
                    <Input
                      placeholder="Nhập từ vựng..."
                      {...register(`words.${index}.word` as const)}
                      disabled={isPending}
                      className="h-9.5 text-xs rounded-lg"
                    />
                    {errors.words?.[index]?.word && (
                      <p className="text-[10px] text-rose-500 font-medium">{errors.words[index]?.word?.message}</p>
                    )}
                  </div>

                  {/* IPA */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Phiên âm (IPA)</Label>
                    <Input
                      placeholder="Ví dụ: /aɪˈɛlts/..."
                      {...register(`words.${index}.ipa` as const)}
                      disabled={isPending}
                      className="h-9.5 text-xs rounded-lg"
                    />
                  </div>

                  {/* Word type (Select) */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Từ loại</Label>
                    <Select
                      defaultValue=""
                      onValueChange={(val) => setValue(`words.${index}.partOfSpeech` as const, val || "")}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-9.5 text-xs rounded-lg">
                        <SelectValue placeholder="Chọn từ loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {partOfSpeechOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Input Fields Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Meaning */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Nghĩa của từ *</Label>
                    <Input
                      placeholder="Nhập nghĩa của từ..."
                      {...register(`words.${index}.meaning` as const)}
                      disabled={isPending}
                      className="h-9.5 text-xs rounded-lg"
                    />
                    {errors.words?.[index]?.meaning && (
                      <p className="text-[10px] text-rose-500 font-medium">{errors.words[index]?.meaning?.message}</p>
                    )}
                  </div>

                  {/* Example sentence */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Câu ví dụ</Label>
                    <Input
                      placeholder="Ví dụ: English is a global language..."
                      {...register(`words.${index}.example` as const)}
                      disabled={isPending}
                      className="h-9.5 text-xs rounded-lg"
                    />
                  </div>

                  {/* Synonyms */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Từ đồng nghĩa</Label>
                    <Input
                      placeholder="Cách nhau bằng dấu phẩy..."
                      {...register(`words.${index}.synonyms` as const)}
                      disabled={isPending}
                      className="h-9.5 text-xs rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-2xl text-muted-foreground text-xs bg-muted/5 flex flex-col items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 opacity-40 animate-pulse" />
            <span>Bộ từ vựng này hiện chưa được thêm từ con.</span>
          </div>
        )}

        {/* Add Word Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ word: "", meaning: "", ipa: "", partOfSpeech: "", example: "", synonyms: "" })}
          disabled={isPending}
          className="w-full h-10 border-dashed rounded-xl text-xs font-semibold gap-1.5 hover:bg-muted/50 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm từ mới
        </Button>
      </SectionCard>

      {/* Form Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t mt-8 max-w-3xl">
        <Link href="/vocabulary" passHref>
          <Button type="button" variant="outline" className="rounded-xl h-10 text-xs px-5 hover:bg-muted cursor-pointer" disabled={isPending}>
            Hủy
          </Button>
        </Link>
        <Button type="submit" className="rounded-xl h-10 text-xs px-5 shadow-xs cursor-pointer" disabled={isPending}>
          {isPending ? "Đang xử lý..." : "Tạo bộ từ"}
        </Button>
      </div>
    </form>
  );
}
