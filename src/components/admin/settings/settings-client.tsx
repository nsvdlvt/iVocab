"use client";

import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  GraduationCap, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FallbackSetting } from "@/lib/admin/fallback-store";
import { saveSettingsAction } from "@/actions/admin/settings";

interface SettingsClientProps {
  initialSettings: Record<string, FallbackSetting>;
  isDatabaseLive?: boolean;
}

export function SettingsClient({ initialSettings, isDatabaseLive = true }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // General Settings state
  const generalInitial = (initialSettings.general_app_info?.value as any) || {};
  const [appName, setAppName] = useState<string>(generalInitial.appName || "Vocabee");
  const [supportEmail, setSupportEmail] = useState<string>(generalInitial.supportEmail || "support@vocabee.site");
  const [defaultLanguage, setDefaultLanguage] = useState<string>(generalInitial.defaultLanguage || "vi");
  const [allowSignups, setAllowSignups] = useState<boolean>(generalInitial.allowSignups ?? true);

  // Learning Settings state
  const learningInitial = (initialSettings.learning_defaults?.value as any) || {};
  const [dailyGoal, setDailyGoal] = useState<number>(learningInitial.defaultDailyGoal ?? 20);
  const [initialInterval, setInitialInterval] = useState<number>(learningInitial.srsInitialIntervalDays ?? 1);
  const [easeFactor, setEaseFactor] = useState<number>(learningInitial.srsEaseFactor ?? 2.5);
  const [maxBatch, setMaxBatch] = useState<number>(learningInitial.maxReviewsPerBatch ?? 30);

  // AI Settings state
  const aiInitial = (initialSettings.ai_configuration?.value as any) || {};
  const [aiModel, setAiModel] = useState<string>(aiInitial.defaultModel || "gemini-2.5-flash");
  const [aiTemp, setAiTemp] = useState<number>(aiInitial.temperature ?? 0.4);
  const [maxTokens, setMaxTokens] = useState<number>(aiInitial.maxOutputTokens ?? 2048);
  const [aiTimeout, setAiTimeout] = useState<number>(aiInitial.timeoutMs ?? 10000);

  const handleSave = async (category: "general" | "learning" | "ai") => {
    try {
      setSavingCategory(category);
      setStatusMessage(null);
      setErrorMessage(null);

      let key = "";
      let value: Record<string, unknown> = {};

      if (category === "general") {
        key = "general_app_info";
        value = { appName, supportEmail, defaultLanguage, allowSignups };
      } else if (category === "learning") {
        key = "learning_defaults";
        value = {
          defaultDailyGoal: Number(dailyGoal),
          srsInitialIntervalDays: Number(initialInterval),
          srsEaseFactor: Number(easeFactor),
          maxReviewsPerBatch: Number(maxBatch),
        };
      } else if (category === "ai") {
        key = "ai_configuration";
        value = {
          defaultModel: aiModel,
          temperature: Number(aiTemp),
          maxOutputTokens: Number(maxTokens),
          timeoutMs: Number(aiTimeout),
        };
      }

      const res = await saveSettingsAction(key, value);
      if (res.ok) {
        setStatusMessage(`Đã lưu cấu hình ${category} thành công vào cơ sở dữ liệu!`);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Không thể lưu cấu hình. Vui lòng kiểm tra quyền hoặc kết nối Supabase.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi không xác định khi lưu cấu hình.");
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isDatabaseLive && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold">Bảng cấu hình `admin_settings` chưa được khởi tạo trên Supabase</p>
            <p className="text-xs opacity-90">
              Hệ thống đang hiển thị giá trị mặc định. Hãy thực thi migration SQL{" "}
              <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-[11px]">
                supabase/migrations/20261017_admin_console_tables_and_policies.sql
              </code>{" "}
              trong Supabase SQL Editor để kích hoạt lưu trữ thực tế.
            </p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm font-semibold">
          <AlertTriangle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs font-semibold">
            <SettingsIcon className="h-4 w-4" /> Cấu hình chung
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-1.5 text-xs font-semibold">
            <GraduationCap className="h-4 w-4" /> Học tập & SRS
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-4 w-4" /> Trí tuệ nhân tạo (AI)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General */}
        <TabsContent value="general">
          <Card className="shadow-xs border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Thiết lập ứng dụng chung</CardTitle>
              <CardDescription>
                Tùy chỉnh thông tin thương hiệu, email hỗ trợ và chính sách mở đăng ký tài khoản.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tên ứng dụng</label>
                  <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email hỗ trợ học viên</label>
                  <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Ngôn ngữ mặc định giao diện</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                  >
                    <option value="vi">Tiếng Việt (vi-VN)</option>
                    <option value="en">English (en-US)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3 sm:mt-5">
                  <div>
                    <div className="text-sm font-semibold">Cho phép đăng ký mới</div>
                    <div className="text-xs text-muted-foreground">Mở cổng đăng ký học viên mới</div>
                  </div>
                  <Switch checked={allowSignups} onCheckedChange={setAllowSignups} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSave("general")}
                  disabled={savingCategory === "general"}
                  className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold"
                >
                  {savingCategory === "general" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Lưu cấu hình chung
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Learning & SRS */}
        <TabsContent value="learning">
          <Card className="shadow-xs border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Thuật toán Học tập & Lặp lại ngắt quãng (SRS)</CardTitle>
              <CardDescription>
                Cấu hình tham số cơ bản cho thuật toán SuperMemo SM-2 và hạn mức ôn tập hàng ngày.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Mục tiêu từ mới / ngày (Default)</label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Số lượng từ vựng khuyến nghị mỗi ngày cho tài khoản mới.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Khoảng thời gian ôn lại ban đầu (ngày)</label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={initialInterval}
                    onChange={(e) => setInitialInterval(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Khoảng cách ngày cho lần ôn tập đầu tiên sau khi học từ mới.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hệ số độ dễ SM-2 Ease Factor ban đầu</label>
                  <Input
                    type="number"
                    step="0.1"
                    min={1.3}
                    max={3.5}
                    value={easeFactor}
                    onChange={(e) => setEaseFactor(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Tiêu chuẩn SuperMemo là 2.5. Giá trị cao hơn làm tăng tốc độ giãn cách.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Giới hạn từ mỗi phiên ôn tập (Batch)</label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={maxBatch}
                    onChange={(e) => setMaxBatch(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Số lượng thẻ hiển thị trong một lượt luyện tập flashcard.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSave("learning")}
                  disabled={savingCategory === "learning"}
                  className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold"
                >
                  {savingCategory === "learning" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Lưu thiết lập học tập
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: AI Configuration */}
        <TabsContent value="ai">
          <Card className="shadow-xs border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Cấu hình Mô hình Trí tuệ Nhân tạo (Gemini)</CardTitle>
              <CardDescription>
                Điều chỉnh thông số suy luận, nhiệt độ sáng tạo và độ trễ ngắt kết nối cho các tác vụ AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Mô hình AI mặc định</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                  >
                    <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Tốc độ & Hiệu năng)</option>
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Suy luận sâu)</option>
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Phiên bản tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nhiệt độ sáng tạo (Temperature: {aiTemp})</label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0.0}
                    max={1.0}
                    value={aiTemp}
                    onChange={(e) => setAiTemp(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Giá trị thấp (0.2 - 0.4) giúp chấm điểm ngữ pháp chính xác và nhất quán.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hạn mức Token xuất tối đa (Max Output Tokens)</label>
                  <Input
                    type="number"
                    min={512}
                    max={8192}
                    step={256}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Thời gian chờ tối đa (Timeout ms)</label>
                  <Input
                    type="number"
                    min={3000}
                    max={30000}
                    step={1000}
                    value={aiTimeout}
                    onChange={(e) => setAiTimeout(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSave("ai")}
                  disabled={savingCategory === "ai"}
                  className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold"
                >
                  {savingCategory === "ai" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Lưu cấu hình AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
