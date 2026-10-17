"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquareCode, History, Play, Plus, RotateCcw, CheckCircle2, Code, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPromptVersionAction,
  rollbackPromptVersionAction,
  testPromptLiveAction,
} from "@/actions/admin/prompts";
import { FallbackPrompt } from "@/lib/admin/fallback-store";
import { toast } from "sonner";

interface PromptsManagerClientProps {
  prompts: FallbackPrompt[];
  isDatabaseLive?: boolean;
}

export function PromptsManagerClient({ prompts, isDatabaseLive = true }: PromptsManagerClientProps) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<string>(prompts[0]?.prompt_key || "sentence_evaluation");

  // Edit / New Version Modal
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [newVersionForm, setNewVersionForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    user_template: "",
    variables: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test Tool State
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    targetWord: "perseverance",
    meaning: "sự kiên trì, bền chí",
    sentence: "Through hard work and perseverance, she finally achieved her dream.",
  });
  const [testOutput, setTestOutput] = useState<{ response?: string; durationMs?: number; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Filter versions for selected key
  const currentKeyPrompts = prompts
    .filter((p) => p.prompt_key === selectedKey)
    .sort((a, b) => b.version - a.version);

  const activePrompt = currentKeyPrompts.find((p) => p.is_active) || currentKeyPrompts[0];

  const handleOpenNewVersion = () => {
    if (!activePrompt) return;
    setNewVersionForm({
      name: activePrompt.name,
      description: activePrompt.description,
      system_prompt: activePrompt.system_prompt,
      user_template: activePrompt.user_template,
      variables: activePrompt.variables,
    });
    setIsNewVersionOpen(true);
  };

  const handleCreateVersion = async () => {
    setIsSubmitting(true);
    try {
      const res = await createPromptVersionAction(selectedKey, newVersionForm);
      if (res.ok) {
        toast.success(`Đã phát hành phiên bản mới v${res.version}`);
        setIsNewVersionOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể tạo phiên bản mới");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRollback = async (version: number) => {
    try {
      const res = await rollbackPromptVersionAction(selectedKey, version);
      if (res.ok) {
        toast.success(`Đã khôi phục về phiên bản v${version}`);
        router.refresh();
      } else {
        toast.error("Không thể khôi phục phiên bản");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const handleRunTest = async () => {
    if (!activePrompt) return;
    setIsTesting(true);
    setTestOutput(null);
    try {
      const res = await testPromptLiveAction(
        activePrompt.system_prompt,
        activePrompt.user_template,
        testVariables
      );
      if (res.ok) {
        setTestOutput({ response: res.response, durationMs: res.durationMs });
        toast.success(`Thử nghiệm thành công (${res.durationMs}ms)`);
      } else {
        setTestOutput({ error: res.error });
        toast.error(res.error || "Lỗi khi chạy prompt");
      }
    } catch (err: unknown) {
      toast.error("Lỗi khi kết nối AI API");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isDatabaseLive && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold">Bảng cấu hình `admin_prompts` chưa được khởi tạo trên Supabase</p>
            <p className="text-xs opacity-90">
              Hệ thống đang hiển thị dữ liệu prompt mặc định. Hãy thực thi migration SQL{" "}
              <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-[11px]">
                supabase/migrations/20261017_admin_console_tables_and_policies.sql
              </code>{" "}
              trong Supabase SQL Editor để kích hoạt tính năng lưu trữ và versioning prompt trên production.
            </p>
          </div>
        </div>
      )}

      {/* Prompt Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {Array.from(new Set(prompts.map((p) => p.prompt_key))).map((key) => {
          const item = prompts.find((p) => p.prompt_key === key);
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedKey(key);
                setTestOutput(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#030f31] text-white shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
              }`}
            >
              {item?.name || key}
            </button>
          );
        })}
      </div>

      {activePrompt && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Prompt Details & Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">{activePrompt.name}</CardTitle>
                    <Badge className="bg-[#f9971d] text-[#030f31] font-bold">
                      Phiên bản v{activePrompt.version} (Active)
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {activePrompt.description} • Key: <code className="font-mono">{activePrompt.prompt_key}</code>
                  </CardDescription>
                </div>
                <Button onClick={handleOpenNewVersion} size="sm" className="bg-[#030f31] text-white font-semibold">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Tạo Phiên bản Mới
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground">System Prompt (Chỉ dẫn hệ thống)</Label>
                  <div className="p-3 rounded-lg border bg-muted/30 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {activePrompt.system_prompt}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground">User Template (Khuôn mẫu câu hỏi)</Label>
                  <div className="p-3 rounded-lg border bg-muted/30 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {activePrompt.user_template}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="font-bold text-foreground">Biến số cần truyền:</span>
                  {activePrompt.variables?.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-[11px]">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Testing Sandbox */}
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Play className="h-4 w-4 text-[#f9971d]" />
                    Chạy thử nghiệm Prompt Trực tiếp (Sandbox)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Điền các biến số và thực thi prompt trên Gemini 2.5 Flash
                  </CardDescription>
                </div>
                <Button
                  onClick={handleRunTest}
                  disabled={isTesting}
                  size="sm"
                  className="bg-[#f9971d] hover:bg-[#e68512] text-[#030f31] font-bold"
                >
                  {isTesting ? "Đang chạy..." : "Thực thi Test Prompt"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activePrompt.variables?.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-[11px] font-mono">{`{{${v}}}`}</Label>
                      <Input
                        value={testVariables[v] || ""}
                        onChange={(e) =>
                          setTestVariables({ ...testVariables, [v]: e.target.value })
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>

                {testOutput && (
                  <div
                    className={`p-3 rounded-lg border space-y-1.5 ${
                      testOutput.response ? "bg-emerald-500/5 border-emerald-500/30" : "bg-destructive/5 border-destructive/30"
                    }`}
                  >
                    <span className="font-bold text-xs text-foreground">
                      Kết quả thử nghiệm {testOutput.durationMs ? `(${testOutput.durationMs}ms)` : ""}:
                    </span>
                    <pre className="p-2.5 rounded bg-background/80 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {testOutput.response || testOutput.error}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Version History Sidebar */}
          <div className="space-y-4">
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-500" />
                  Lịch sử Phiên bản ({currentKeyPrompts.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Danh sách phiên bản đã phát hành và khôi phục (Rollback)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentKeyPrompts.map((vp) => (
                  <div
                    key={vp.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                      vp.is_active ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Phiên bản v{vp.version}</span>
                      {vp.is_active ? (
                        <Badge className="bg-[#f9971d] text-[#030f31] text-[10px]">Đang dùng</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRollback(vp.version)}
                          className="h-6 text-[11px] text-primary hover:bg-primary/10"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Khôi phục
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{vp.name}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      {format(new Date(vp.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* New Version Dialog */}
      <Dialog open={isNewVersionOpen} onOpenChange={setIsNewVersionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo Phiên bản Prompt Mới</DialogTitle>
            <DialogDescription>
              Cập nhật câu lệnh chỉ dẫn hệ thống. Phiên bản mới sẽ tự động kích hoạt ngay sau khi tạo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Tên Prompt</Label>
              <Input
                value={newVersionForm.name}
                onChange={(e) => setNewVersionForm({ ...newVersionForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả thay đổi</Label>
              <Input
                value={newVersionForm.description}
                onChange={(e) => setNewVersionForm({ ...newVersionForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>System Prompt (Chỉ dẫn hệ thống)</Label>
              <Textarea
                rows={5}
                value={newVersionForm.system_prompt}
                onChange={(e) => setNewVersionForm({ ...newVersionForm, system_prompt: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>User Template (Khuôn mẫu câu hỏi)</Label>
              <Textarea
                rows={3}
                value={newVersionForm.user_template}
                onChange={(e) => setNewVersionForm({ ...newVersionForm, user_template: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNewVersionOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleCreateVersion} disabled={isSubmitting}>
              {isSubmitting ? "Đang phát hành..." : "Phát hành Phiên bản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
