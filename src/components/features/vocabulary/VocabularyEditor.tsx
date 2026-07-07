"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createVocabularySet } from "@/actions/vocab-sets/create";
import { updateVocabularySetWithWords } from "@/actions/vocab-sets/update-with-words";
import { VocabularyToolbar } from "./VocabularyToolbar";
import { VocabularyInfoCard } from "./VocabularyInfoCard";
import { VocabularyCard } from "./VocabularyCard";
import { ROUTES } from "@/constants/routes";
import { AnimatePresence } from "framer-motion";

interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  partOfSpeech: string;
  example: string;
  synonyms: string;
  antonyms: string;
  note: string;
  example_translation: string;
}

interface VocabularyEditorProps {
  initialSetId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialVisibility?: "private" | "public" | "unlisted";
  initialItems?: VocabularyItem[];
}

export function VocabularyEditor({
  initialSetId,
  initialTitle = "",
  initialDescription = "",
  initialVisibility = "private",
  initialItems = [],
}: VocabularyEditorProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const isEditMode = !!initialSetId;

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">(initialVisibility);

  // Error States
  const [errors, setErrors] = useState<{
    title?: string;
    items?: Record<string, { word?: string; meaning?: string }>;
  }>({});

  // Dynamic Vocabulary List States (Initial with 3 empty items if Create, or initial list if Edit)
  const [items, setItems] = useState<VocabularyItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            id: "vocab-init-1",
            word: "",
            meaning: "",
            ipa: "",
            partOfSpeech: "",
            example: "",
            synonyms: "",
            antonyms: "",
            note: "",
            example_translation: "",
          },
          {
            id: "vocab-init-2",
            word: "",
            meaning: "",
            ipa: "",
            partOfSpeech: "",
            example: "",
            synonyms: "",
            antonyms: "",
            note: "",
            example_translation: "",
          },
          {
            id: "vocab-init-3",
            word: "",
            meaning: "",
            ipa: "",
            partOfSpeech: "",
            example: "",
            synonyms: "",
            antonyms: "",
            note: "",
            example_translation: "",
          },
        ]
  );

  const handleAddCard = () => {
    const newId = `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        word: "",
        meaning: "",
        ipa: "",
        partOfSpeech: "",
        example: "",
        synonyms: "",
        antonyms: "",
        note: "",
        example_translation: "",
      },
    ]);
  };

  const handleRemoveCard = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (errors.items && errors.items[id]) {
      const newItemsErrors = { ...errors.items };
      delete newItemsErrors[id];
      setErrors((prev) => ({ ...prev, items: newItemsErrors }));
    }
  };

  const handleChangeField = (id: string, field: keyof VocabularyItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    // Clear validation error dynamically on change
    if (errors.items && errors.items[id]) {
      const cardErr = errors.items[id];
      if (field === "word" && cardErr.word && value.trim()) {
        const newCardErr = { ...cardErr };
        delete newCardErr.word;
        setErrors((prev) => ({
          ...prev,
          items: { ...prev.items, [id]: newCardErr },
        }));
      } else if (field === "meaning" && cardErr.meaning && value.trim()) {
        const newCardErr = { ...cardErr };
        delete newCardErr.meaning;
        setErrors((prev) => ({
          ...prev,
          items: { ...prev.items, [id]: newCardErr },
        }));
      }
    }
  };

  // Callback to append quick imported cards
  const handleImportCards = (
    newCards: Array<{
      word: string;
      meaning: string;
      ipa?: string;
      partOfSpeech?: string;
      example?: string;
      exampleSentence?: string;
      synonyms?: string[] | string;
      topic?: string;
    }>
  ) => {
    const importedItems = newCards.map((card, idx) => ({
      id: `vocab-import-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      word: card.word,
      meaning: card.meaning,
      ipa: card.ipa || "",
      partOfSpeech: card.partOfSpeech || "",
      example: card.exampleSentence || card.example || "",
      synonyms: Array.isArray(card.synonyms) ? card.synonyms.join(", ") : card.synonyms || "",
      antonyms: "",
      note: "",
      example_translation: "",
    }));

    setItems((prev) => {
      const onlyHasInitialEmpty = prev.every((item) => !item.word.trim() && !item.meaning.trim());
      if (onlyHasInitialEmpty) {
        return importedItems;
      }
      return [...prev, ...importedItems];
    });
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Tiêu đề bộ thẻ không được bỏ trống";
    }

    const filledItems = items.filter((item) => item.word.trim() || item.meaning.trim());

    const cardErrors: Record<string, { word?: string; meaning?: string }> = {};
    let hasCardErrors = false;

    filledItems.forEach((item) => {
      const itemErrors: { word?: string; meaning?: string } = {};
      if (!item.word.trim()) {
        itemErrors.word = "Không để trống";
        hasCardErrors = true;
      }
      if (!item.meaning.trim()) {
        itemErrors.meaning = "Không để trống";
        hasCardErrors = true;
      }
      if (Object.keys(itemErrors).length > 0) {
        cardErrors[item.id] = itemErrors;
      }
    });

    if (hasCardErrors) {
      newErrors.items = cardErrors;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng bổ sung các thông tin còn thiếu.");
      return;
    }

    setIsPending(true);
    try {
      const vocabSetData = {
        title: title.trim(),
        description: description.trim(),
        source_language: "en",
        target_language: "vi",
        visibility,
        color: "",
        icon: "",
      };

      const mappedWords = filledItems.map((item) => ({
        // Keep ID for updates in Edit Mode, exclude placeholder generated IDs in Create Mode
        id: item.id.startsWith("vocab-init-") || item.id.startsWith("vocab-import-") || item.id.startsWith("vocab-") ? undefined : item.id,
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        ipa: item.ipa.trim() || undefined,
        partOfSpeech: item.partOfSpeech.trim() || undefined,
        example: item.example.trim() || undefined,
        synonyms: item.synonyms.trim() || undefined,
        antonyms: item.antonyms.trim() || undefined,
        note: item.note.trim() || undefined,
        example_translation: item.example_translation.trim() || undefined,
      }));

      let res;
      if (isEditMode && initialSetId) {
        res = await updateVocabularySetWithWords(initialSetId, vocabSetData, mappedWords);
      } else {
        res = await createVocabularySet(vocabSetData, mappedWords);
      }

      if (res.success) {
        const targetSetId = initialSetId || (res as { setId?: string }).setId || "";
        toast.success(isEditMode ? "Đã cập nhật bộ từ vựng thành công!" : "Đã tạo bộ thẻ học thành công!");
        router.push(ROUTES.VOCABULARY_DETAIL(targetSetId));
      } else {
        toast.error((res as { error?: string }).error || "Không thể lưu bộ từ vựng.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER TOOLBAR */}
      <VocabularyToolbar
        visibility={visibility}
        onChangeVisibility={setVisibility}
        isPending={isPending}
        onCreateClick={handleSave}
        onImportCards={handleImportCards}
        existingWords={items.map(item => ({ word: item.word, meaning: item.meaning }))}
      />

      <div className="max-w-3xl mx-auto space-y-8 px-4 sm:px-6">
        {/* INFO SECTION */}
        <VocabularyInfoCard
          title={title}
          onChangeTitle={(val) => {
            setTitle(val);
            if (errors.title && val.trim()) {
              setErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
          description={description}
          onChangeDescription={setDescription}
          isPending={isPending}
          error={errors.title}
        />

        {/* LIST SECTION */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/60 tracking-wider select-none uppercase">
            <span>Danh sách từ vựng ({items.length})</span>
            <span>Trực tiếp nhập liệu trên các thẻ phía dưới</span>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <VocabularyCard
                  key={item.id}
                  index={index}
                  item={item}
                  onChangeField={handleChangeField}
                  onRemove={handleRemoveCard}
                  isPending={isPending}
                  errors={errors.items?.[item.id]}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* ADD WORD ROW ACTION BUTTON */}
          <div className="flex justify-center pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleAddCard}
              disabled={isPending}
              className="rounded-xl h-9 text-xs font-semibold gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm từ vựng mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
