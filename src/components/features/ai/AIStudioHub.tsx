"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, Theater, Lightbulb } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StoryConfigDeck, VocabSetOption, DueWordOption, PresetPackOption } from "./StoryConfigDeck";
import { StoryReader } from "./StoryReader";
import { RoleplayStudio } from "./RoleplayStudio";
import { ChatInterface } from "./ChatInterface";
import { StoryResponsePayload } from "@/app/api/ai/story/route";
import { toast } from "sonner";

export function AIStudioHub() {
  const [activeTab, setActiveTab] = useState<string>("storyteller");

  // Options state
  const [vocabSets, setVocabSets] = useState<VocabSetOption[]>([]);
  const [dueWords, setDueWords] = useState<DueWordOption[]>([]);
  const [presets, setPresets] = useState<PresetPackOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);

  // Storyteller state
  const [activeStory, setActiveStory] = useState<StoryResponsePayload | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);

  // Load vocab options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/ai/vocab-options");
        const data = await res.json();
        if (data.success) {
          setVocabSets(data.sets || []);
          setDueWords(data.dueWords || []);
          setPresets(data.presets || []);
        }
      } catch (err) {
        console.error("Failed to load vocab options:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleGenerateStory = async (params: {
    words: Array<{ word: string; meaning?: string; pos?: string }>;
    genre: string;
    level: string;
    length: "short" | "medium";
  }) => {
    setIsGeneratingStory(true);
    try {
      const response = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Không thể dệt câu chuyện. Vui lòng thử lại.");
      }

      setActiveStory(resData.data);
      toast.success("Câu chuyện AI đã được dệt xong!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/60">
            <TabsTrigger
              value="storyteller"
              className="gap-2 rounded-xl text-xs md:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={2} />
              <span>Dệt truyện ngẫu hồi</span>
            </TabsTrigger>
            <TabsTrigger
              value="roleplay"
              className="gap-2 rounded-xl text-xs md:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Theater className="h-4 w-4 text-violet-500" strokeWidth={2} />
              <span>Thử thách Nhập vai</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="gap-2 rounded-xl text-xs md:text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Bot className="h-4 w-4 text-primary" strokeWidth={2} />
              <span>Gia sư AI</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: AI Storyteller */}
        <TabsContent value="storyteller" className="mt-0 focus-visible:outline-none">
          {activeStory ? (
            <StoryReader
              story={activeStory}
              onBackToConfig={() => setActiveStory(null)}
            />
          ) : (
            <StoryConfigDeck
              vocabSets={vocabSets}
              dueWords={dueWords}
              presets={presets}
              isLoadingOptions={isLoadingOptions}
              onGenerate={handleGenerateStory}
              isGenerating={isGeneratingStory}
            />
          )}
        </TabsContent>

        {/* Tab 2: AI Roleplay Mission */}
        <TabsContent value="roleplay" className="mt-0 focus-visible:outline-none">
          <RoleplayStudio
            vocabSets={vocabSets}
            dueWords={dueWords}
            presets={presets}
          />
        </TabsContent>

        {/* Tab 3: Chat Tutor */}
        <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={2} />
                <span>Gợi ý nhanh cho bạn:</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium">
                  &ldquo;Tạo mẹo nhớ (Mnemonic) cho từ &lsquo;resilient&rsquo;&rdquo;
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium">
                  &ldquo;Phân biệt &lsquo;affect&rsquo; và &lsquo;effect&rsquo; chi tiết&rdquo;
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium">
                  &ldquo;Chữa câu tiếng Anh của tôi tự nhiên hơn&rdquo;
                </span>
              </div>
            </div>
            <ChatInterface />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
