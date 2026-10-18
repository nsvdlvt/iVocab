"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Sparkles,
  Edit,
  Copy,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Smartphone,
  Bell,
  Code2,
  UserCheck,
  Check,
  Layers,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  duplicateTemplateAction,
  validateTemplateAction,
  sendTestNotificationAction,
  getRealUsersForPreviewAction,
  renderRealUserPreviewAction,
  getSampleContextAction,
  getRegisteredVariablesAction,
} from "@/actions/admin/notification-templates";
import {
  TemplateVariableDefinition,
} from "@/lib/notifications/template-variables";
import { NotificationTemplateRow, CreateTemplateInput } from "@/repositories/admin/notification-template.repository";
import { renderTemplate } from "@/lib/notifications/template-renderer";

interface TemplatesManagerProps {
  initialTemplates: NotificationTemplateRow[];
}

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const [templates, setTemplates] = useState<NotificationTemplateRow[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableVariables, setAvailableVariables] = useState<TemplateVariableDefinition[]>([]);
  const [sampleContext, setSampleContext] = useState<Record<string, unknown>>({});
  const [realUsers, setRealUsers] = useState<Array<{ id: string; name: string; email: string; streak: number }>>([]);

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formType, setFormType] = useState<"info" | "warning" | "success" | "broadcast">("info");
  const [formChannels, setFormChannels] = useState<"in_app" | "push" | "both">("both");
  const [formPriority, setFormPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [formActionUrl, setFormActionUrl] = useState("/notifications");
  const [formStatus, setFormStatus] = useState<"draft" | "active" | "paused" | "archived">("draft");

  // Variable Picker Drawer & Suggestion
  const [variableSearch, setVariableSearch] = useState("");
  const [variableCategory, setVariableCategory] = useState<string>("all");
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [lastFocusedField, setLastFocusedField] = useState<"title" | "body">("body");

  // Validation State
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    variables: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Preview State
  const [previewMode, setPreviewMode] = useState<"sample" | "real">("sample");
  const [selectedRealUserId, setSelectedRealUserId] = useState<string>("");
  const [realPreviewData, setRealPreviewData] = useState<{
    ok: boolean;
    title?: string;
    body?: string;
    actionUrl?: string;
    missingVariables?: string[];
    error?: string;
    userData?: Record<string, unknown>;
  } | null>(null);
  const [isLoadingRealPreview, setIsLoadingRealPreview] = useState(false);

  // Test Notification Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTemplateId, setTestTemplateId] = useState<string | null>(null);
  const [testChannel, setTestChannel] = useState<"in_app" | "push" | "both">("both");
  const [testTargetUserId, setTestTargetUserId] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load variables, sample context & real users
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [vars, sample, users] = await Promise.all([
          getRegisteredVariablesAction(),
          getSampleContextAction(),
          getRealUsersForPreviewAction(),
        ]);
        if (isMounted) {
          setAvailableVariables(vars);
          setSampleContext(sample);
          setRealUsers(users);
          if (users.length > 0) {
            setSelectedRealUserId(users[0].id);
            setTestTargetUserId(users[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load template editor data:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormTitle("🐝 {name} ơi, đừng quên học từ vựng nhé!");
    setFormBody("Bạn đã học được {word_count} từ và đang duy trì streak {streak} ngày. Cùng tiếp tục nhé!");
    setFormType("info");
    setFormChannels("both");
    setFormPriority("normal");
    setFormActionUrl("/vocabulary");
    setFormStatus("draft");
    setValidationResult(null);
    setRealPreviewData(null);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: NotificationTemplateRow) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormDescription(t.description || "");
    setFormTitle(t.title_template);
    setFormBody(t.body_template);
    setFormType(t.type);
    setFormChannels(t.delivery_channels);
    setFormPriority(t.priority);
    setFormActionUrl(t.action_url || "/notifications");
    setFormStatus(t.status);
    setValidationResult(null);
    setRealPreviewData(null);
    setIsEditorOpen(true);
  };

  // Insert Variable at cursor position
  const handleInsertVariable = (varKey: string) => {
    const placeholder = `{${varKey}}`;

    if (lastFocusedField === "title" && titleInputRef.current) {
      const input = titleInputRef.current;
      const start = input.selectionStart ?? formTitle.length;
      const end = input.selectionEnd ?? formTitle.length;
      const nextText = formTitle.slice(0, start) + placeholder + formTitle.slice(end);
      setFormTitle(nextText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 50);
    } else if (bodyTextareaRef.current) {
      const textarea = bodyTextareaRef.current;
      const start = textarea.selectionStart ?? formBody.length;
      const end = textarea.selectionEnd ?? formBody.length;
      const nextText = formBody.slice(0, start) + placeholder + formBody.slice(end);
      setFormBody(nextText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 50);
    }
  };

  // Validate Template
  const handleValidate = async () => {
    setIsValidating(true);
    const res = await validateTemplateAction({
      title: formTitle,
      body: formBody,
    });
    setValidationResult(res);
    setIsValidating(false);
  };

  // Fetch real user preview
  const handleFetchRealPreview = async (userId: string) => {
    if (!userId) return;
    setIsLoadingRealPreview(true);
    const res = await renderRealUserPreviewAction(userId, formTitle, formBody, formActionUrl);
    if (res.ok) {
      setRealPreviewData(res);
    }
    setIsLoadingRealPreview(false);
  };

  // Save Template
  const handleSave = async () => {
    if (!formName.trim() || !formTitle.trim() || !formBody.trim()) {
      alert("Vui lòng điền đầy đủ Tên mẫu, Tiêu đề và Nội dung.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateTemplateInput = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        title_template: formTitle.trim(),
        body_template: formBody.trim(),
        type: formType,
        delivery_channels: formChannels,
        priority: formPriority,
        action_url: formActionUrl.trim() || "/notifications",
        status: formStatus,
      };

      if (editingId) {
        const res = await updateTemplateAction(editingId, payload);
        if (res.ok && res.data) {
          setTemplates((prev) => prev.map((t) => (t.id === editingId ? res.data! : t)));
          setIsEditorOpen(false);
        } else {
          alert(res.error || "Không thể cập nhật mẫu thông báo");
        }
      } else {
        const res = await createTemplateAction(payload);
        if (res.ok && res.data) {
          setTemplates((prev) => [res.data!, ...prev]);
          setIsEditorOpen(false);
        } else {
          alert(res.error || "Không thể tạo mẫu thông báo");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Template
  const handleDuplicate = async (id: string) => {
    const res = await duplicateTemplateAction(id);
    if (res.ok && res.data) {
      setTemplates((prev) => [res.data!, ...prev]);
    } else {
      alert(res.error || "Không thể nhân bản mẫu");
    }
  };

  // Delete Template
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu "${name}" không?`)) return;
    const res = await deleteTemplateAction(id);
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert(res.error || "Không thể xóa mẫu thông báo");
    }
  };

  // Open Test Dispatch Modal
  const handleOpenTestModal = (templateId: string) => {
    setTestTemplateId(templateId);
    setTestResult(null);
    setTestModalOpen(true);
  };

  // Execute Test Send
  const handleExecuteTestSend = async () => {
    if (!testTemplateId || !testTargetUserId) return;
    setIsSendingTest(true);
    setTestResult(null);

    const res = await sendTestNotificationAction(
      testTemplateId,
      testChannel,
      testTargetUserId
    );

    setIsSendingTest(false);
    if (res.ok) {
      const sentMethods = [];
      if (res.inAppSent) sentMethods.push("In-app");
      if (res.pushSent) sentMethods.push("Web Push");
      setTestResult({
        success: true,
        message: `Đã gửi thử nghiệm thành công qua kênh: ${sentMethods.join(", ") || "In-app"}!`,
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || "Gửi thử nghiệm thất bại",
      });
    }
  };

  // Filtered Templates
  const filteredTemplates = templates.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(q) ||
      t.title_template.toLowerCase().includes(q) ||
      t.body_template.toLowerCase().includes(q)
    );
  });

  // Filtered variables for picker
  const filteredVariables = availableVariables.filter((v) => {
    if (variableCategory !== "all" && v.category !== variableCategory) return false;
    if (!variableSearch.trim()) return true;
    const q = variableSearch.toLowerCase();
    return (
      v.key.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  });

  // Render Sample Preview
  const sampleRendered = renderTemplate(
    {
      title: formTitle,
      body: formBody,
      action_url: formActionUrl,
    },
    sampleContext
  );

  return (
    <div className="space-y-6">
      {/* Top Bar Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm mẫu theo tên, tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 rounded-xl bg-card border-border"
            />
          </div>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border text-xs font-semibold">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl gap-2 font-bold cursor-pointer shadow-sm text-xs h-10 px-4 bg-[#f9971d] text-[#030f31] hover:bg-[#e08516]"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo mẫu thông báo mới</span>
        </Button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full border border-dashed border-border rounded-2xl p-12 text-center space-y-3 bg-card/50">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Không tìm thấy mẫu thông báo nào</h3>
              <p className="text-xs text-muted-foreground">
                Hãy tạo mẫu thông báo đầu tiên với các biến động như {"{name}"}, {"{streak}"}, {"{word_count}"}.
              </p>
            </div>
            <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" />
              Tạo mẫu ngay
            </Button>
          </div>
        ) : (
          filteredTemplates.map((t) => (
            <Card
              key={t.id}
              className="rounded-2xl border-border/80 hover:border-border transition-all duration-200 bg-card text-card-foreground shadow-2xs flex flex-col justify-between overflow-hidden"
            >
              <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      t.status === "active"
                        ? "default"
                        : t.status === "paused"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {t.status}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] gap-1 font-semibold border-border">
                      {t.delivery_channels === "both" ? (
                        <>
                          <Bell className="h-2.5 w-2.5 text-primary" />
                          <Smartphone className="h-2.5 w-2.5 text-primary" />
                          <span>Both</span>
                        </>
                      ) : t.delivery_channels === "push" ? (
                        <>
                          <Smartphone className="h-2.5 w-2.5 text-primary" />
                          <span>Push</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-2.5 w-2.5 text-primary" />
                          <span>In-app</span>
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">{t.name}</h4>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {t.description}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                {/* Template Content Box */}
                <div className="rounded-xl bg-muted/40 p-3 border border-border/60 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground line-clamp-1">{t.title_template}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed font-mono">
                    {t.body_template}
                  </div>
                </div>

                {/* Variables Badges */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
                    <Tag className="h-2.5 w-2.5" /> Biến:
                  </span>
                  {t.variables_used && t.variables_used.length > 0 ? (
                    t.variables_used.slice(0, 4).map((v) => (
                      <span
                        key={v}
                        className="text-[10px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-mono font-medium"
                      >
                        {`{${v}}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Không có biến</span>
                  )}
                  {t.variables_used && t.variables_used.length > 4 && (
                    <span className="text-[10px] text-muted-foreground font-bold">
                      +{t.variables_used.length - 4}
                    </span>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(t.updated_at).toLocaleDateString("vi-VN")}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenTestModal(t.id)}
                      title="Gửi thử nghiệm cho Admin"
                      className="rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDuplicate(t.id)}
                      title="Nhân bản mẫu này"
                      className="rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenEdit(t)}
                      title="Chỉnh sửa mẫu"
                      className="rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(t.id, t.name)}
                      title="Xóa mẫu"
                      className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* TEMPLATE EDITOR & DYNAMIC PREVIEW DIALOG                                  */}
      {/* ========================================================================= */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl sm:max-w-5xl h-[92vh] max-h-[850px] p-0 flex flex-col overflow-hidden rounded-2xl border-border bg-card">
          <DialogHeader className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>{editingId ? "Chỉnh sửa mẫu thông báo động" : "Tạo mẫu thông báo động mới"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tùy chỉnh tiêu đề và nội dung với các biến động như {"{name}"}, {"{streak}"}, {"{word_count}"}.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="rounded-xl text-xs gap-1.5 h-8 border-border"
                >
                  {isValidating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>Kiểm tra cú pháp</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Dialog Main Content Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/80">
            {/* Left Column: Form Fields & Variable Inserter (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Validation Alert */}
              {validationResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in-50 ${
                    validationResult.isValid
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-destructive/10 text-destructive border-destructive/30"
                  }`}
                >
                  {validationResult.isValid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">
                      {validationResult.isValid
                        ? "Mẫu hợp lệ! Tất cả các biến đều nằm trong thư viện hỗ trợ."
                        : "Phát hiện lỗi cú pháp trong mẫu:"}
                    </div>
                    {validationResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px] leading-relaxed">
                        • {err}
                      </div>
                    ))}
                    {validationResult.variables.length > 0 && (
                      <div className="text-[11px] pt-1">
                        Biến phát hiện: {validationResult.variables.map((v) => `{${v}}`).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Template Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Tên mẫu (Nội bộ) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Nhắc học hằng ngày 20:00"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="rounded-xl h-9 text-xs border-border bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Trạng thái</label>
                  <Select
                    value={formStatus}
                    onValueChange={(val: string | null) => {
                      if (val) setFormStatus(val as "draft" | "active" | "paused" | "archived");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                      <SelectItem value="active">Kích hoạt (Active)</SelectItem>
                      <SelectItem value="paused">Tạm dừng (Paused)</SelectItem>
                      <SelectItem value="archived">Lưu trữ (Archived)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Channels & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Kênh gửi</label>
                  <Select
                    value={formChannels}
                    onValueChange={(val: string | null) => {
                      if (val) setFormChannels(val as "in_app" | "push" | "both");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Cả In-app & Web Push</SelectItem>
                      <SelectItem value="in_app">Chỉ In-app</SelectItem>
                      <SelectItem value="push">Chỉ Web Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Loại thông báo</label>
                  <Select
                    value={formType}
                    onValueChange={(val: string | null) => {
                      if (val) setFormType(val as "info" | "warning" | "success" | "broadcast");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Tin tức (Info)</SelectItem>
                      <SelectItem value="warning">Cảnh báo (Warning)</SelectItem>
                      <SelectItem value="success">Thành công (Success)</SelectItem>
                      <SelectItem value="broadcast">Toàn hệ thống (Broadcast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mức ưu tiên</label>
                  <Select
                    value={formPriority}
                    onValueChange={(val: string | null) => {
                      if (val) setFormPriority(val as "normal" | "high" | "urgent" | "low");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Thông thường (Normal)</SelectItem>
                      <SelectItem value="high">Ưu tiên cao (High)</SelectItem>
                      <SelectItem value="urgent">Khẩn cấp (Urgent)</SelectItem>
                      <SelectItem value="low">Thấp (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title Input with cursor tracking */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Tiêu đề thông báo <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Hỗ trợ chèn biến</span>
                </div>
                <Input
                  ref={titleInputRef}
                  placeholder="VD: 🐝 {name} ơi, đừng quên học từ vựng nhé!"
                  value={formTitle}
                  onFocus={() => setLastFocusedField("title")}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="rounded-xl h-10 text-xs border-border bg-background font-medium"
                />
              </div>

              {/* Body Input with cursor tracking */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Nội dung thông báo <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Nhập {"{"} để chọn nhanh biến</span>
                </div>
                <Textarea
                  ref={bodyTextareaRef}
                  placeholder="VD: Bạn đã học được {word_count} từ và đang duy trì streak {streak} ngày..."
                  value={formBody}
                  onFocus={() => setLastFocusedField("body")}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={4}
                  className="rounded-xl text-xs border-border bg-background leading-relaxed font-sans"
                />
              </div>

              {/* Action URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Đường dẫn khi click (Action URL)</label>
                <Input
                  placeholder="/vocabulary hoặc /review"
                  value={formActionUrl}
                  onChange={(e) => setFormActionUrl(e.target.value)}
                  className="rounded-xl h-9 text-xs border-border bg-background"
                />
              </div>

              {/* Variable Quick Inserter Box */}
              <div className="border border-border/70 rounded-xl p-3 bg-muted/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-primary" />
                    Thư viện biến động (Click để chèn)
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-muted-foreground">Đang chọn:</span>
                    <Badge variant="outline" className="text-[10px] font-semibold py-0 px-1.5">
                      {lastFocusedField === "title" ? "Tiêu đề" : "Nội dung"}
                    </Badge>
                  </div>
                </div>

                {/* Variable Filter Bar */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Tìm tên biến..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    className="h-7 text-[11px] rounded-lg bg-background"
                  />
                  <Select value={variableCategory} onValueChange={(val) => setVariableCategory(val || "all")}>
                    <SelectTrigger className="w-[110px] h-7 text-[11px] rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nhóm</SelectItem>
                      <SelectItem value="user">Người dùng</SelectItem>
                      <SelectItem value="learning">Học tập</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="system">Hệ thống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Variable Chips */}
                <div className="max-h-[140px] overflow-y-auto flex flex-wrap gap-1.5 pr-1">
                  {filteredVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      title={`${v.label} - Nguồn: ${v.dataSource}`}
                      className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 transition-colors text-left flex items-center gap-1.5 cursor-pointer text-xs group"
                    >
                      <span className="font-mono font-bold text-primary group-hover:underline">
                        {`{${v.key}}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                        {v.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Previews (Sample & Real User) (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 bg-muted/15 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Preview Header & Mode Toggle */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Xem trước thời gian thực</span>
                  </div>

                  <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border border-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("sample")}
                      className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        previewMode === "sample"
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Dữ liệu mẫu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewMode("real");
                        if (selectedRealUserId) {
                          handleFetchRealPreview(selectedRealUserId);
                        }
                      }}
                      className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        previewMode === "real"
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      User thật
                    </button>
                  </div>
                </div>

                {/* Real User Selector (if mode is real) */}
                {previewMode === "real" && (
                  <div className="p-2.5 rounded-xl border border-border bg-card space-y-2 animate-in fade-in-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        Chọn tài khoản học viên để thử render:
                      </span>
                      <div className="flex items-center gap-1">
                        {isLoadingRealPreview ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : selectedRealUserId ? (
                          <button
                            type="button"
                            onClick={() => handleFetchRealPreview(selectedRealUserId)}
                            className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Làm mới
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <Select
                      value={selectedRealUserId}
                      onValueChange={(val) => {
                        if (val) {
                          setSelectedRealUserId(val);
                          handleFetchRealPreview(val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                        <SelectValue placeholder="Chọn học viên..." />
                      </SelectTrigger>
                      <SelectContent>
                        {realUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.email || "Không email"} - Streak: {u.streak} ngày)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preview Badge Label */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold">Giao diện thông báo In-App:</span>
                  <Badge
                    variant={previewMode === "sample" ? "secondary" : "default"}
                    className="text-[10px] font-bold"
                  >
                    {previewMode === "sample" ? "MINH HỌA (SAMPLE)" : "DỮ LIỆU THẬT (REAL)"}
                  </Badge>
                </div>

                {/* In-App Preview Card */}
                <div className="rounded-2xl border border-primary/30 p-4 bg-card text-card-foreground shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#f9971d] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#f9971d] uppercase">Thông báo mới</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1 border-border">
                        {formType}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Vừa xong</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {previewMode === "real" && realPreviewData
                      ? realPreviewData.title
                      : sampleRendered.title}
                  </h4>

                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {previewMode === "real" && realPreviewData
                      ? realPreviewData.body
                      : sampleRendered.body}
                  </p>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Vocabee System</span>
                    <span className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                      Xem ngay <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>

                {/* Web Push Notification Preview Card */}
                {(formChannels === "push" || formChannels === "both") && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Smartphone className="h-3 w-3 text-primary" />
                      Mô phỏng Web Push trên thiết bị:
                    </span>

                    <div className="rounded-xl border border-border bg-slate-900 text-white p-3 shadow-md space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#f9971d] flex items-center justify-center text-[8px] text-[#030f31] font-bold">
                            V
                          </div>
                          <span className="font-semibold text-slate-300">Vocabee Push</span>
                        </div>
                        <span>Bây giờ</span>
                      </div>

                      <div className="font-bold text-xs text-slate-100">
                        {previewMode === "real" && realPreviewData
                          ? realPreviewData.title
                          : sampleRendered.title}
                      </div>

                      <div className="text-[11px] text-slate-300 line-clamp-2">
                        {previewMode === "real" && realPreviewData
                          ? realPreviewData.body
                          : sampleRendered.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons in Dialog Footer */}
              <div className="pt-4 border-t border-border/80 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Hủy
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="rounded-xl text-xs gap-1.5 h-9 font-bold bg-[#f9971d] text-[#030f31] hover:bg-[#e08516]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{editingId ? "Cập nhật mẫu" : "Lưu mẫu"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* TEST DISPATCH MODAL                                                       */}
      {/* ========================================================================= */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span>Gửi thử nghiệm mẫu thông báo</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thông báo thử nghiệm CHỈ gửi đến tài khoản được chỉ định bên dưới. Không ảnh hưởng đến học viên khác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/30"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Người nhận thử nghiệm</label>
              <Select value={testTargetUserId} onValueChange={(val) => setTestTargetUserId(val || "")}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Chọn tài khoản..." />
                </SelectTrigger>
                <SelectContent>
                  {realUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email || "Không email"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Kênh gửi thử nghiệm</label>
              <Select
                value={testChannel}
                onValueChange={(val: string | null) => {
                  if (val) setTestChannel(val as "in_app" | "push" | "both");
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Cả In-App & Web Push</SelectItem>
                  <SelectItem value="in_app">Chỉ In-App</SelectItem>
                  <SelectItem value="push">Chỉ Web Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Đóng
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteTestSend}
              disabled={isSendingTest}
              className="rounded-xl text-xs gap-1.5 font-bold"
            >
              {isSendingTest ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Bắn thông báo thử</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
