"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Zap,
  CheckCircle2,
  Trophy,
  ArrowLeft,
  Volume2,
  RefreshCw,
  Target,
  Theater,
  Coffee,
  Briefcase,
  Luggage,
  Building2,
  Circle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS } from "@/app/api/ai/roleplay/route";
import { toast } from "sonner";

function ScenarioIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  switch (name) {
    case "Coffee":
      return <Coffee className={className} strokeWidth={1.85} />;
    case "Briefcase":
      return <Briefcase className={className} strokeWidth={1.85} />;
    case "Luggage":
      return <Luggage className={className} strokeWidth={1.85} />;
    case "Building2":
      return <Building2 className={className} strokeWidth={1.85} />;
    default:
      return <Theater className={className} strokeWidth={1.85} />;
  }
}

interface RoleplayStudioProps {
  vocabSets: Array<{
    id: string;
    title: string;
    words: Array<{ word: string; meaning: string }>;
  }>;
  dueWords: Array<{ word: string; meaning: string }>;
  presets: Array<{
    id: string;
    title: string;
    words: Array<{ word: string; meaning: string }>;
  }>;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  usedWords?: string[];
  coachingTip?: string;
  timestamp: string;
}

export function RoleplayStudio({ vocabSets: _vocabSets, dueWords, presets }: RoleplayStudioProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("coffee-shop");
  const [targetWords, setTargetWords] = useState<string[]>([
    "spontaneous",
    "elaborate",
    "awkward",
    "reluctant",
    "coincidence",
  ]);
  const [isMissionActive, setIsMissionActive] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usedWordsHistory, setUsedWordsHistory] = useState<Set<string>>(new Set());
  const [isMissionWon, setIsMissionWon] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentScenario = SCENARIOS[selectedScenarioId] || SCENARIOS["coffee-shop"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartMission = () => {
    if (targetWords.length === 0) {
      toast.error("Vui lòng chọn ít nhất 2 từ vựng mục tiêu cho nhiệm vụ.");
      return;
    }

    setMessages([
      {
        id: "msg-initial",
        role: "assistant",
        content: currentScenario.initialMessage,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setUsedWordsHistory(new Set());
    setIsMissionWon(false);
    setIsMissionActive(true);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenarioId,
          targetWords,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          userInput: text,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Không thể kết nối tới máy chủ.");
      }

      const { detectedWords, reply, coachingTip, isGoalMet } = resData.data;

      // Update used words
      if (detectedWords && detectedWords.length > 0) {
        const nextUsed = new Set(usedWordsHistory);
        detectedWords.forEach((w: string) => nextUsed.add(w.toLowerCase()));
        setUsedWordsHistory(nextUsed);

        toast.success(`🎯 Bạn vừa vận dụng thành công: ${detectedWords.join(", ")}!`);

        // Check if user completed target threshold (e.g. used at least 3 words)
        if (nextUsed.size >= Math.min(3, targetWords.length) || isGoalMet) {
          setIsMissionWon(true);
        }
      }

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        usedWords: detectedWords,
        coachingTip,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi gửi tin nhắn.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  // If mission is not started, show the Scenario & Target Word setup deck
  if (!isMissionActive) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-background to-primary/5 p-6 md:p-8 backdrop-blur-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
              <Theater className="h-3.5 w-3.5 text-violet-500 shrink-0" strokeWidth={2} />
              <span>AI Roleplay Mission</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Thử thách nhập vai: Ép dùng từ để qua ải
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Học vẹt không bằng thực chiến. Chọn một tình huống đời thực, trò chuyện cùng nhân vật ảo
              và khéo léo vận dụng các từ vựng mục tiêu trong từng câu thoại!
            </p>
          </div>
        </div>

        {/* 1. Pick Scenario */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" strokeWidth={2} />
            1. Chọn kịch bản tình huống
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SCENARIOS).map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 shadow-md ring-1 ring-violet-500/30"
                      : "border-border/80 bg-card hover:border-violet-500/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0 shadow-xs flex items-center justify-center">
                      <ScenarioIcon name={scenario.iconName} className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{scenario.title}</h4>
                        {isSelected && (
                          <Badge className="bg-violet-600 text-white text-[10px]">Đang chọn</Badge>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        Đối thoại với: {scenario.characterName} ({scenario.characterRole})
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {scenario.goal}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Choose Target Words to Challenge */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" strokeWidth={2} />
                2. Từ vựng mục tiêu bắt buộc dùng trong thử thách ({targetWords.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Nhiệm vụ của bạn là lồng ghép các từ này một cách tự nhiên vào các câu chat.
              </p>
            </div>
            {dueWords.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetWords(dueWords.slice(0, 5).map((w) => w.word))}
                className="text-xs gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={2} /> Dùng từ SRS cần ôn ({dueWords.length})
              </Button>
            )}
          </div>

          {/* Quick preset selector */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTargetWords(preset.words.slice(0, 5).map((w) => w.word))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" strokeWidth={1.85} />
                <span>{preset.title}</span>
              </button>
            ))}
          </div>

          {/* Words Chips Display */}
          <div className="flex flex-wrap gap-2 pt-2">
            {targetWords.map((word, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="px-3 py-1 text-xs font-semibold rounded-xl border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200"
              >
                {word}
              </Badge>
            ))}
          </div>

          <Button
            type="button"
            onClick={handleStartMission}
            className="w-full h-12 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2} /> Bắt đầu thử thách nhập vai
          </Button>
        </div>
      </div>
    );
  }

  // Active Roleplay Mission Live Chat
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200 max-w-4xl mx-auto">
      {/* Sticky Mission Objective HUD */}
      <div className="sticky top-16 z-30 rounded-2xl border border-violet-500/30 bg-background/95 p-4 shadow-lg backdrop-blur-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setIsMissionActive(false)}
              className="text-xs text-muted-foreground gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} /> Đổi kịch bản
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center">
                <ScenarioIcon name={currentScenario.iconName} className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground leading-none">
                  {currentScenario.characterName}
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  {currentScenario.characterRole}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tiến độ từ:</span>
            <Badge
              variant="outline"
              className={`text-xs font-bold ${
                usedWordsHistory.size >= Math.min(3, targetWords.length)
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              }`}
            >
              {usedWordsHistory.size}/{targetWords.length} từ đã dùng
            </Badge>
          </div>
        </div>

        {/* Target Words Live HUD Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Mục tiêu:</span>
          {targetWords.map((word) => {
            const isUsed = usedWordsHistory.has(word.toLowerCase());
            return (
              <div
                key={word}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                  isUsed
                    ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 scale-105 shadow-xs"
                    : "bg-muted/50 text-muted-foreground border border-border/70"
                }`}
              >
                {isUsed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground/60 shrink-0" strokeWidth={2} />
                )}
                <span>{word}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="min-h-[400px] max-h-[560px] overflow-y-auto rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-muted-foreground">
                  {isUser ? "Bạn" : currentScenario.characterName} • {msg.timestamp}
                </span>
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(msg.content)}
                    aria-label="Nghe phát âm câu thoại"
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-sm hover:bg-muted/40 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-3.5 w-3.5" strokeWidth={1.85} />
                  </button>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                    : "bg-muted/40 border border-border text-foreground rounded-tl-xs"
                }`}
              >
                {msg.content}
              </div>

              {/* Coaching Feedback Bubble under assistant message */}
              {msg.coachingTip && (
                <div className="max-w-[85%] rounded-xl bg-violet-500/10 border border-violet-500/20 px-3.5 py-2 text-xs text-violet-900 dark:text-violet-200 animate-in fade-in-50">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-violet-700 dark:text-violet-300 mb-0.5">
                    <Lightbulb className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={2} />
                    AI Coach Nhận xét:
                  </span>
                  {msg.coachingTip}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            {currentScenario.characterName} đang suy nghĩ câu trả lời...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <Input
          placeholder={`Nhập câu trả lời bằng tiếng Anh (thử dùng các từ mục tiêu)...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
        />
        <Button
          type="button"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          aria-label="Gửi tin nhắn"
          className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shrink-0 cursor-pointer"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">Gửi</span>
        </Button>
      </div>

      {/* Mission Won Celebration Card */}
      {isMissionWon && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Thử thách hoàn thành xuất sắc!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Bạn đã vận dụng thành công các từ vựng vào ngữ cảnh thực tế. Thưởng +50 Mật hoa Vocabee!
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMissionActive(false)}
            className="border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl cursor-pointer"
          >
            Đổi kịch bản khác
          </Button>
        </div>
      )}
    </div>
  );
}
