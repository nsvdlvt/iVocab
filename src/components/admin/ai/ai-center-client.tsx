"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bot, Play, CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Cpu, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { testLiveGeminiAction } from "@/actions/admin/ai";
import { AiTelemetryStats } from "@/repositories/admin/ai.repository";
import { FallbackAiLog } from "@/lib/admin/fallback-store";
import { toast } from "sonner";

interface AiCenterClientProps {
  telemetry: AiTelemetryStats;
  logs: FallbackAiLog[];
}

export function AiCenterClient({ telemetry, logs }: AiCenterClientProps) {
  const [testPrompt, setTestPrompt] = useState(
    "Giải thích ngắn gọn sự khác nhau giữa 'diligent' và 'assiduous' bằng tiếng Việt trong 2 câu."
  );
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    response?: string;
    durationMs?: number;
    error?: string;
  } | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const handleRunTest = async () => {
    if (!testPrompt.trim()) {
      toast.error("Vui lòng nhập nội dung prompt để kiểm tra");
      return;
    }

    setIsRunningTest(true);
    setTestResult(null);
    try {
      const res = await testLiveGeminiAction(testPrompt);
      setTestResult(res);
      if (res.ok) {
        toast.success(`Phản hồi thành công (${res.durationMs}ms)`);
      } else {
        toast.error(res.error || "Lỗi khi gọi AI API");
      }
    } catch (err: unknown) {
      toast.error("Đã xảy ra lỗi kết nối");
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {!telemetry.isDatabaseLive && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold">Bảng theo dõi `ai_usage_logs` chưa được khởi tạo trên Supabase</p>
            <p className="text-xs opacity-90">
              Số liệu đo lường đang hiển thị ở chế độ mẫu ban đầu. Hãy thực thi migration SQL{" "}
              <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-[11px]">
                supabase/migrations/20261017_admin_console_tables_and_policies.sql
              </code>{" "}
              trong Supabase SQL Editor để thu thập dữ liệu token và chi phí thực tế.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nhà cung cấp AI</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{telemetry.activeProvider}</p>
              <p className="text-xs text-muted-foreground font-mono">{telemetry.configuredModel}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cấu hình API Key</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={
                    telemetry.isApiKeyConfigured
                      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-bold"
                      : "text-destructive border-destructive/30 bg-destructive/10 font-bold"
                  }
                >
                  {telemetry.isApiKeyConfigured ? "ĐÃ CẤU HÌNH (GEMINI_API_KEY)" : "CHƯA CẤU HÌNH"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bảo mật server-only</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-[#f9971d]">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tỷ lệ Phản hồi Thành công</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {telemetry.successRate}%
              </p>
              <p className="text-xs text-muted-foreground">{telemetry.totalRequests} lượt gọi đã ghi nhận</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Độ trễ Trung bình</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {telemetry.avgDurationMs > 0 ? `${telemetry.avgDurationMs}ms` : "< 1s"}
              </p>
              <p className="text-xs text-muted-foreground">Thời gian sinh phản hồi</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live AI Test Execution Playground */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#f9971d]" />
            Khu vực Kiểm tra Thực thi Trực tiếp (Live AI Playground)
          </CardTitle>
          <CardDescription className="text-xs">
            Gửi yêu cầu kiểm tra trực tiếp tới mô hình Gemini 2.5 Flash để đo độ trễ và độ chuẩn xác phản hồi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder="Nhập prompt tiếng Anh hoặc tiếng Việt để gửi đến Gemini..."
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="font-sans text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Mô hình: <code className="font-mono text-foreground font-semibold">gemini-2.5-flash</code>
              </span>
              <Button
                onClick={handleRunTest}
                disabled={isRunningTest}
                className="bg-[#f9971d] hover:bg-[#e68512] text-[#030f31] font-bold h-9"
              >
                <Play className="h-4 w-4 mr-1.5" />
                {isRunningTest ? "Đang gọi Gemini..." : "Thực thi Test Live"}
              </Button>
            </div>
          </div>

          {/* Test Output */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-sm space-y-2 ${
                testResult.ok ? "bg-emerald-500/5 border-emerald-500/30" : "bg-destructive/5 border-destructive/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 font-bold text-xs ${testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {testResult.ok ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Phản hồi thành công ({testResult.durationMs}ms)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>Lỗi thực thi ({testResult.durationMs}ms)</span>
                    </>
                  )}
                </span>
              </div>
              <div className="font-mono text-xs whitespace-pre-wrap bg-background/80 p-3 rounded-lg border max-h-60 overflow-y-auto">
                {testResult.ok ? testResult.response : testResult.error}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Features & Telemetry Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features breakdown */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Các Tính năng AI Tích hợp</CardTitle>
            <CardDescription className="text-xs">Các phân hệ đang sử dụng Gemini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">AI Writing Assistant</p>
                <p className="text-muted-foreground">Chấm câu và đánh giá lỗi sai ngữ pháp</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Hoạt động</Badge>
            </div>

            <div className="p-3 rounded-lg border bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">AI Quiz Generator</p>
                <p className="text-muted-foreground">Tự động sinh 4 đáp án trắc nghiệm theo ngữ cảnh</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Hoạt động</Badge>
            </div>

            <div className="p-3 rounded-lg border bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">AI Vocabulary Import Enricher</p>
                <p className="text-muted-foreground">Tự động điền IPA, định nghĩa và ví dụ khi nhập văn bản</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Hoạt động</Badge>
            </div>

            <div className="p-3 rounded-lg border bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">AI Story & Roleplay</p>
                <p className="text-muted-foreground">Tạo truyện ngắn chứa danh sách từ vựng</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Hoạt động</Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Logs */}
        <Card className="shadow-xs border-border/80 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Nhật ký Yêu cầu AI Gần đây ({logs.length})
            </CardTitle>
            <CardDescription className="text-xs">Theo dõi thời lượng, số token và trạng thái từng cuộc gọi</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Chưa có nhật ký AI nào được ghi nhận. Hãy thử chạy test ở trên!
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Tính năng</th>
                      <th className="px-3 py-2.5">Mô hình</th>
                      <th className="px-3 py-2.5">Độ trễ</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {logs.slice(0, 10).map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-semibold text-foreground capitalize">
                          {l.feature}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{l.model}</td>
                        <td className="px-3 py-2.5 font-mono">{l.duration_ms}ms</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={
                              l.status === "success"
                                ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                                : "text-destructive border-destructive/30 bg-destructive/10"
                            }
                          >
                            {l.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {format(new Date(l.created_at), "dd/MM HH:mm", { locale: vi })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
