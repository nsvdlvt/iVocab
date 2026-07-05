"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AITestPage() {
  const [word, setWord] = useState("abandon");
  const [sentence, setSentence] = useState("She decided to abandon her old car.");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});

  const handleTestSentence = async () => {
    setLoading((prev) => ({ ...prev, sentence: true }));
    try {
      const response = await fetch("/api/ai/sentence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          sentence,
          options: {
            meaning: "rời bỏ, ruồng bỏ",
            partOfSpeech: "verb",
          },
        }),
      });

      const data = await response.json();
      setResults((prev) => ({ ...prev, sentence: data }));
      if (response.ok) {
        toast.success("Đánh giá câu thành công!");
      } else {
        toast.error("Đánh giá câu thất bại: " + (data.error || "Lỗi không xác định"));
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Lỗi kết nối API đánh giá");
    } finally {
      setLoading((prev) => ({ ...prev, sentence: false }));
    }
  };

  const handleTestHelper = async (type: "hint" | "example" | "another-example" | "explain" | "generate-more") => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const response = await fetch("/api/ai/writing-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          targetWord: word,
          language: "en",
          writingType: "sentence",
        }),
      });

      const data = await response.json();
      setResults((prev) => ({ ...prev, [type]: data }));
      if (response.ok) {
        toast.success(`Tải trợ lý "${type}" thành công!`);
      } else {
        toast.error(`Tải trợ lý "${type}" thất bại: ` + (data.error || "Lỗi không xác định"));
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(`Lỗi kết nối trợ lý ${type}`);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <PageContainer className="space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader
        title="Kiểm thử Kết nối AI"
        description="Giao diện debug để kiểm tra khả năng tích hợp và phản hồi từ dịch vụ AI (OpenAI Responses API) qua Route Handlers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="md:col-span-1 border rounded-2xl bg-card p-5 space-y-4 shadow-sm h-fit">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Cấu hình Thử nghiệm</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 block">Từ khóa mục tiêu (Word)</label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 block">Câu đặt thử (Sentence)</label>
            <textarea
              rows={3}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <Button
              className="w-full rounded-xl"
              onClick={handleTestSentence}
              disabled={loading["sentence"]}
            >
              {loading["sentence"] ? "Đang đánh giá câu..." : "🚀 Đánh giá câu (POST /sentence)"}
            </Button>
          </div>
        </div>

        {/* AI Helper Triggers */}
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-2xl bg-card p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Trợ lý Viết (POST /writing-assistant)</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => handleTestHelper("hint")}
                disabled={loading["hint"]}
              >
                {loading["hint"] ? "Đang tải..." : "💡 Gợi ý (Hint)"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => handleTestHelper("example")}
                disabled={loading["example"]}
              >
                {loading["example"] ? "Đang tải..." : "📝 Ví dụ (Example)"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => handleTestHelper("another-example")}
                disabled={loading["another-example"]}
              >
                {loading["another-example"] ? "Đang tải..." : "🔄 Ví dụ khác (Another Example)"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => handleTestHelper("explain")}
                disabled={loading["explain"]}
              >
                {loading["explain"] ? "Đang tải..." : "🔍 Giải thích (Explain)"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => handleTestHelper("generate-more")}
                disabled={loading["generate-more"]}
              >
                {loading["generate-more"] ? "Đang tải..." : "🚀 3 câu mẫu (Generate More)"}
              </Button>
            </div>
          </div>

          {/* Results Output */}
          <div className="border rounded-2xl bg-card p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Kết quả Phản hồi (JSON Response)</h3>
            <div className="bg-muted/30 border rounded-xl p-4 max-h-[350px] overflow-auto">
              {Object.keys(results).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Bấm các nút kích hoạt thử nghiệm bên cạnh để xem phản hồi thực tế từ API.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(results).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{key}</span>
                      <pre className="text-xs font-mono bg-white dark:bg-black/20 p-3 rounded-lg border overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
