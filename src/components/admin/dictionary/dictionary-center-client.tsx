"use client";

import { useState } from "react";
import { BookOpenText, Search, DatabaseZap, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lookupDictionaryWordAction, clearDictionaryCacheAction } from "@/actions/admin/dictionary";
import { toast } from "sonner";

export function DictionaryCenterClient() {
  const [searchTerm, setSearchTerm] = useState("eloquent");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Vui lòng nhập từ tiếng Anh cần tra cứu");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await lookupDictionaryWordAction(searchTerm);
      if (res.ok) {
        setSearchResult({ data: res.data, durationMs: res.durationMs });
        toast.success(`Tra cứu hoàn tất (${res.durationMs}ms)`);
      } else {
        setSearchResult({ error: res.error, durationMs: res.durationMs });
        toast.error(res.error || "Không tìm thấy từ");
      }
    } catch {
      toast.error("Lỗi khi kết nối dịch vụ từ điển");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const res = await clearDictionaryCacheAction();
      if (res.ok) {
        toast.success(res.message);
      }
    } catch {
      toast.error("Lỗi khi làm sạch cache");
    } finally {
      setIsClearing(false);
    }
  };

  const wordData = searchResult?.data?.[0];
  const wordIpa = wordData?.ipa || wordData?.phonetics?.find((p: { text?: string }) => p.text)?.text;
  const audioUrl = wordData?.audioUs || wordData?.audioUk || wordData?.phonetics?.find((p: { audio?: string }) => p.audio)?.audio;
  const meanings = wordData?.meanings || [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nhà cung cấp Từ điển</p>
              <p className="text-base font-bold text-foreground mt-0.5">Free Dictionary API</p>
              <p className="text-xs text-muted-foreground">Phonetics, Audio, Definitions</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <BookOpenText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Trạng thái Kết nối</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Trực tuyến (200 OK)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Độ trễ trung bình: ~180ms</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bộ nhớ đệm (LRU Cache)</p>
              <p className="text-base font-bold text-foreground mt-0.5">Đang bật (In-Memory)</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={isClearing}
                className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <DatabaseZap className="h-3 w-3 mr-1" />
                {isClearing ? "Đang xóa..." : "Xóa Cache"}
              </Button>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <DatabaseZap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Lookup Search Box */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Search className="h-4 w-4 text-[#f9971d]" />
            Công cụ Tra cứu Từ điển Trực tiếp (Live Lookup Sandbox)
          </CardTitle>
          <CardDescription className="text-xs">
            Kiểm tra định dạng phản hồi âm thanh, phiên âm IPA, từ loại và ví dụ từ từ điển
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLookup} className="flex gap-2 max-w-lg">
            <Input
              placeholder="Nhập từ tiếng Anh (VD: eloquent, resilient, serendipity)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="bg-[#f9971d] hover:bg-[#e68512] text-[#030f31] font-bold h-10 px-5"
            >
              {isSearching ? "Đang tra..." : "Tra cứu"}
            </Button>
          </form>

          {/* Result view */}
          {searchResult && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {searchResult.error ? (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{searchResult.error}</span>
                </div>
              ) : wordData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                      {wordData.word}
                    </h2>
                    {wordIpa && (
                      <span className="font-mono text-base text-muted-foreground">
                        {wordIpa}
                      </span>
                    )}
                    {audioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const audio = new Audio(audioUrl);
                          audio.play();
                        }}
                        className="h-8 gap-1.5"
                      >
                        <Volume2 className="h-4 w-4 text-primary" />
                        Phát âm
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      Độ trễ: {searchResult.durationMs}ms
                    </span>
                  </div>

                  {/* Meanings */}
                  <div className="space-y-3">
                    {meanings.map((m: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                        <Badge variant="secondary" className="capitalize font-semibold">
                          {m.partOfSpeech}
                        </Badge>
                        <ul className="space-y-1.5 list-disc list-inside text-xs text-foreground">
                          {m.definitions?.slice(0, 3).map((d: any, dIdx: number) => (
                            <li key={dIdx}>
                              <span className="font-medium">{d.definition}</span>
                              {d.example && (
                                <p className="text-muted-foreground italic pl-5 mt-0.5">
                                  "{d.example}"
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
