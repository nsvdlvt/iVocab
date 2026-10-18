"use client";

import React, { useState } from "react";
import {
  Plus,
  Play,
  Eye,
  Edit,
  Trash2,
  Clock,
  Zap,
  Calendar,
  CheckCircle2,
  Search,
  Loader2,
  Sliders,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  createRuleAction,
  updateRuleAction,
  toggleRuleActiveAction,
  deleteRuleAction,
  previewRecipientsAction,
  runRuleAction,
} from "@/actions/admin/notification-templates";
import {
  NotificationAutomationRuleRow,
  NotificationTemplateRow,
  CreateRuleInput,
} from "@/repositories/admin/notification-template.repository";

interface AutomationRulesManagerProps {
  initialRules: Array<
    NotificationAutomationRuleRow & { template_name?: string; template_title?: string }
  >;
  templates: NotificationTemplateRow[];
}

interface ConditionItem {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export function AutomationRulesManager({
  initialRules,
  templates,
}: AutomationRulesManagerProps) {
  const [rules, setRules] = useState(initialRules);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");

  // Rule Editor Dialog
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formTriggerType, setFormTriggerType] = useState<
    "scheduled" | "activity" | "inactivity" | "custom_condition"
  >("scheduled");
  const [formScheduledTime, setFormScheduledTime] = useState("20:00");
  const [formActivityEvent, setFormActivityEvent] = useState("review_due");
  const [formMinInactiveDays, setFormMinInactiveDays] = useState(3);
  const [formAudience, setFormAudience] = useState<
    "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom"
  >("all");
  const [formConditions, setFormConditions] = useState<ConditionItem[]>([]);
  const [formConditionLogic, setFormConditionLogic] = useState<"AND" | "OR">("AND");
  const [formCooldownHours, setFormCooldownHours] = useState(24);
  const [formMaxPerDay, setFormMaxPerDay] = useState(1);
  const [formIsActive, setFormIsActive] = useState(false);

  // Preview Recipients Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    ruleId: string;
    ruleName: string;
    totalEligible: number;
    samples: Array<{
      userId: string;
      name: string;
      email: string;
      renderedTitle: string;
      renderedBody: string;
      actionUrl: string | null;
    }>;
  } | null>(null);

  // Run Rule Modal & State
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runningRuleId, setRunningRuleId] = useState<string | null>(null);
  const [runningRuleName, setRunningRuleName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormTemplateId(templates.length > 0 ? templates[0].id : "");
    setFormTriggerType("scheduled");
    setFormScheduledTime("20:00");
    setFormActivityEvent("review_due");
    setFormMinInactiveDays(3);
    setFormAudience("all");
    setFormConditions([{ field: "words_learned_today", operator: "<", value: 1 }]);
    setFormConditionLogic("AND");
    setFormCooldownHours(24);
    setFormMaxPerDay(1);
    setFormIsActive(false);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rule: NotificationAutomationRuleRow) => {
    setEditingId(rule.id);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormTemplateId(rule.template_id);
    setFormTriggerType(rule.trigger_type);

    const cfg = (rule.trigger_config as Record<string, unknown>) || {};
    setFormScheduledTime((cfg.time as string) || "20:00");
    setFormActivityEvent((cfg.event as string) || "review_due");
    setFormMinInactiveDays((cfg.min_inactive_days as number) || 3);
    setFormConditionLogic((cfg.logic as "AND" | "OR") || "AND");

    setFormAudience(rule.target_audience);
    setFormConditions(Array.isArray(rule.conditions) ? (rule.conditions as unknown as ConditionItem[]) : []);
    setFormCooldownHours(rule.cooldown_hours);
    setFormMaxPerDay(rule.max_per_user_per_day);
    setFormIsActive(rule.is_active);
    setIsEditorOpen(true);
  };

  // Add / remove condition rows
  const handleAddCondition = () => {
    setFormConditions((prev) => [
      ...prev,
      { field: "streak", operator: ">=", value: 1 },
    ]);
  };

  const handleUpdateCondition = (index: number, key: keyof ConditionItem, value: string | number) => {
    setFormConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c))
    );
  };

  const handleRemoveCondition = (index: number) => {
    setFormConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle Active
  const handleToggleActive = async (id: string, current: boolean) => {
    const next = !current;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: next } : r))
    );
    await toggleRuleActiveAction(id, next);
  };

  // Save Rule
  const handleSave = async () => {
    if (!formName.trim() || !formTemplateId) {
      alert("Vui lòng nhập tên quy tắc và chọn mẫu thông báo.");
      return;
    }

    setIsSaving(true);
    try {
      let triggerConfig: Record<string, unknown> = {};
      if (formTriggerType === "scheduled") {
        triggerConfig = {
          schedule_type: "daily",
          time: formScheduledTime,
          timezone: "Asia/Ho_Chi_Minh",
        };
      } else if (formTriggerType === "activity") {
        triggerConfig = { event: formActivityEvent };
      } else if (formTriggerType === "inactivity") {
        triggerConfig = { min_inactive_days: formMinInactiveDays };
      } else {
        triggerConfig = { logic: formConditionLogic };
      }

      const payload: CreateRuleInput = {
        template_id: formTemplateId,
        name: formName.trim(),
        description: formDescription.trim() || null,
        trigger_type: formTriggerType,
        trigger_config: triggerConfig,
        target_audience: formAudience,
        conditions: formConditions,
        cooldown_hours: formCooldownHours,
        max_per_user_per_day: formMaxPerDay,
        is_active: formIsActive,
      };

      if (editingId) {
        const res = await updateRuleAction(editingId, payload);
        if (res.ok && res.data) {
          const tName = templates.find((t) => t.id === res.data!.template_id)?.name;
          setRules((prev) =>
            prev.map((r) =>
              r.id === editingId ? { ...res.data!, template_name: tName } : r
            )
          );
          setIsEditorOpen(false);
        } else {
          alert(res.error || "Không thể cập nhật quy tắc");
        }
      } else {
        const res = await createRuleAction(payload);
        if (res.ok && res.data) {
          const tName = templates.find((t) => t.id === res.data!.template_id)?.name;
          setRules((prev) => [{ ...res.data!, template_name: tName }, ...prev]);
          setIsEditorOpen(false);
        } else {
          alert(res.error || "Không thể tạo quy tắc");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Rule
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quy tắc tự động "${name}"?`)) return;
    const res = await deleteRuleAction(id);
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error || "Không thể xóa quy tắc");
    }
  };

  // Preview Recipients
  const handleOpenPreviewRecipients = async (ruleId: string) => {
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewModalOpen(true);
    const res = await previewRecipientsAction(ruleId);
    if (res.ok) {
      setPreviewData(res.data || null);
    }
    setPreviewLoading(false);
  };

  // Open Run Modal
  const handleOpenRunModal = (ruleId: string, ruleName: string) => {
    setRunningRuleId(ruleId);
    setRunningRuleName(ruleName);
    setRunResult(null);
    setRunModalOpen(true);
  };

  // Execute Rule
  const handleExecuteRule = async (dryRun = false) => {
    if (!runningRuleId) return;
    setIsRunning(true);
    setRunResult(null);
    const res = await runRuleAction(runningRuleId, dryRun);
    setIsRunning(false);
    if (res.ok) {
      setRunResult(res.summary || null);
    } else {
      alert(res.error || "Lỗi khi chạy quy tắc");
    }
  };

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    if (triggerFilter !== "all" && r.trigger_type !== triggerFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.template_name && r.template_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Bar Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm quy tắc tự động..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 rounded-xl bg-card border-border"
            />
          </div>

          <Select value={triggerFilter} onValueChange={(val) => setTriggerFilter(val || "all")}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border text-xs font-semibold">
              <SelectValue placeholder="Loại trigger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trigger</SelectItem>
              <SelectItem value="scheduled">Theo lịch</SelectItem>
              <SelectItem value="activity">Theo sự kiện</SelectItem>
              <SelectItem value="inactivity">Không hoạt động</SelectItem>
              <SelectItem value="custom_condition">Điều kiện tùy biến</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl gap-2 font-bold cursor-pointer shadow-sm text-xs h-10 px-4 bg-[#f9971d] text-[#030f31] hover:bg-[#e08516]"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm quy tắc tự động mới</span>
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3 bg-card/50">
            <Sliders className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Không có quy tắc tự động nào</h3>
              <p className="text-xs text-muted-foreground">
                Tạo quy tắc để tự động kích hoạt thông báo theo lịch hoặc hành vi học tập của học viên.
              </p>
            </div>
            <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" />
              Thêm quy tắc ngay
            </Button>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const conditionsCount = Array.isArray(rule.conditions) ? rule.conditions.length : 0;

            return (
              <div
                key={rule.id}
                className="rounded-2xl border border-border/80 hover:border-border bg-card p-4 sm:p-5 text-card-foreground shadow-2xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={rule.is_active ? "default" : "secondary"}
                        className="text-[10px] font-bold uppercase tracking-wider"
                      >
                        {rule.is_active ? "Đang chạy" : "Tạm dừng"}
                      </Badge>

                      <Badge variant="outline" className="text-[10px] font-semibold border-border gap-1">
                        {rule.trigger_type === "scheduled" ? (
                          <>
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>Theo lịch</span>
                          </>
                        ) : rule.trigger_type === "activity" ? (
                          <>
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span>Sự kiện học tập</span>
                          </>
                        ) : rule.trigger_type === "inactivity" ? (
                          <>
                            <Clock className="h-3 w-3 text-purple-500" />
                            <span>Vắng mặt</span>
                          </>
                        ) : (
                          <>
                            <Sliders className="h-3 w-3 text-blue-500" />
                            <span>Điều kiện lọc</span>
                          </>
                        )}
                      </Badge>

                      <span className="text-[11px] text-muted-foreground font-medium">
                        Mẫu:{" "}
                        <span className="text-foreground font-semibold">
                          {rule.template_name || "Chưa gán"}
                        </span>
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-foreground">
                      {rule.name}
                    </h4>

                    {rule.description && (
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    )}
                  </div>

                  {/* Right: Switch & Quick Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right text-[11px] space-y-0.5 hidden md:block">
                      <div className="text-muted-foreground">Đã gửi thành công</div>
                      <div className="font-bold text-foreground">{rule.total_sent} lượt</div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-border pl-4" title={rule.is_active ? "Tạm dừng quy tắc" : "Kích hoạt quy tắc"}>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule.id, rule.is_active)}
                      />
                    </div>
                  </div>
                </div>

                {/* Conditions & Execution Bar */}
                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">
                      Đối tượng: <strong className="text-foreground">{rule.target_audience}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">
                      Giới hạn: <strong className="text-foreground">{rule.cooldown_hours}h cooldown</strong>
                    </span>
                    {conditionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">
                        {conditionsCount} điều kiện lọc
                      </span>
                    )}
                    {rule.last_run_at && (
                      <span className="text-muted-foreground">
                        Chạy gần nhất: {new Date(rule.last_run_at).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreviewRecipients(rule.id)}
                      className="rounded-xl text-xs gap-1 h-8 border-border hover:bg-muted"
                      title="Ước tính đối tượng phù hợp"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Xem trước đối tượng</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRunModal(rule.id, rule.name)}
                      className="rounded-xl text-xs gap-1 h-8 border-border hover:bg-muted text-emerald-600 dark:text-emerald-400"
                      title="Chạy quy tắc ngay bây giờ"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Chạy ngay</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenEdit(rule)}
                      className="rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Chỉnh sửa quy tắc"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Xóa quy tắc"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* RULE EDITOR DIALOG                                                        */}
      {/* ========================================================================= */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span>{editingId ? "Chỉnh sửa quy tắc tự động" : "Thêm quy tắc tự động mới"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cấu hình thời điểm kích hoạt, đối tượng và điều kiện logic an toàn để tự động gửi thông báo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Rule Name & Template selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Tên quy tắc <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="VD: Nhắc học 20:00 hằng ngày"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl h-9 text-xs border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Mẫu thông báo gán kèm <span className="text-destructive">*</span>
                </label>
                <Select value={formTemplateId} onValueChange={(val) => setFormTemplateId(val || "")}>
                  <SelectTrigger className="rounded-xl h-9 text-xs border-border">
                    <SelectValue placeholder="Chọn mẫu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Mô tả quy tắc (Tùy chọn)</label>
              <Input
                placeholder="Ghi chú nội bộ cho quy tắc này..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="rounded-xl h-9 text-xs border-border"
              />
            </div>

            {/* Trigger Configuration */}
            <div className="border border-border/70 rounded-xl p-3.5 bg-muted/20 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Cơ chế kích hoạt (Trigger Type)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Loại kích hoạt</label>
                  <Select
                    value={formTriggerType}
                    onValueChange={(val: string | null) => {
                      if (val) setFormTriggerType(val as "scheduled" | "activity" | "inactivity" | "custom_condition");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Theo lịch hằng ngày (Scheduled)</SelectItem>
                      <SelectItem value="activity">Theo sự kiện học tập (Activity)</SelectItem>
                      <SelectItem value="inactivity">Không hoạt động (Inactivity)</SelectItem>
                      <SelectItem value="custom_condition">Điều kiện tùy biến (Custom Filter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-config depending on trigger */}
                {formTriggerType === "scheduled" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Giờ gửi trong ngày</label>
                    <Input
                      type="time"
                      value={formScheduledTime}
                      onChange={(e) => setFormScheduledTime(e.target.value)}
                      className="rounded-xl h-9 text-xs border-border bg-background"
                    />
                  </div>
                )}

                {formTriggerType === "activity" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Sự kiện kích hoạt</label>
                    <Select
                      value={formActivityEvent}
                      onValueChange={(val) => setFormActivityEvent(val || "review_due")}
                    >
                      <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="review_due">Có từ vựng đến hạn ôn tập</SelectItem>
                        <SelectItem value="streak_preservation">Cảnh báo giữ chuỗi streak</SelectItem>
                        <SelectItem value="daily_goal_reached">Đạt mục tiêu học hôm nay</SelectItem>
                        <SelectItem value="milestone">Đạt cột mốc kỷ lục mới</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formTriggerType === "inactivity" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Số ngày không học tối thiểu</label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={formMinInactiveDays}
                      onChange={(e) => setFormMinInactiveDays(Number(e.target.value))}
                      className="rounded-xl h-9 text-xs border-border bg-background"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Target Audience & Cooldown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Đối tượng nhận</label>
                <Select
                  value={formAudience}
                  onValueChange={(val: string | null) => {
                    if (val) setFormAudience(val as "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom");
                  }}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả học viên (All)</SelectItem>
                    <SelectItem value="learners">Người có ít nhất 1 từ</SelectItem>
                    <SelectItem value="has_due_reviews">Người có từ đến hạn ôn</SelectItem>
                    <SelectItem value="inactive">Người vắng mặt &gt;= 3 ngày</SelectItem>
                    <SelectItem value="goal_not_completed">Chưa đạt mục tiêu hôm nay</SelectItem>
                    <SelectItem value="custom">Tùy biến theo điều kiện lọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Giãn cách gửi (Cooldown)</label>
                <Input
                  type="number"
                  min={1}
                  value={formCooldownHours}
                  onChange={(e) => setFormCooldownHours(Number(e.target.value))}
                  placeholder="24"
                  className="rounded-xl h-9 text-xs border-border"
                />
                <span className="text-[10px] text-muted-foreground">Không gửi lại cùng 1 người trong X giờ</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Kích hoạt ngay</label>
                <div className="pt-1.5 flex items-center gap-2">
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formIsActive ? "Đang chạy" : "Tạm dừng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Condition Builder */}
            <div className="border border-border/70 rounded-xl p-3.5 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Điều kiện lọc an toàn (Condition Builder)
                </span>

                <div className="flex items-center gap-2">
                  <Select
                    value={formConditionLogic}
                    onValueChange={(val: string | null) => {
                      if (val) setFormConditionLogic(val as "AND" | "OR");
                    }}
                  >
                    <SelectTrigger className="w-[85px] h-7 text-[11px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">Tất cả (AND)</SelectItem>
                      <SelectItem value="OR">Ít nhất một (OR)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCondition}
                    className="h-7 text-[11px] rounded-lg gap-1 border-border"
                  >
                    <Plus className="h-3 w-3" />
                    Thêm điều kiện
                  </Button>
                </div>
              </div>

              {formConditions.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Chưa thiết lập điều kiện bổ sung nào. Quy tắc sẽ áp dụng cho toàn bộ đối tượng được chọn.
                </div>
              ) : (
                <div className="space-y-2">
                  {formConditions.map((cond, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border">
                      <Select
                        value={cond.field}
                        onValueChange={(val) => val && handleUpdateCondition(idx, "field", val)}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="words_learned_today">words_learned_today</SelectItem>
                          <SelectItem value="words_review_due">words_review_due</SelectItem>
                          <SelectItem value="streak">streak</SelectItem>
                          <SelectItem value="word_count">word_count</SelectItem>
                          <SelectItem value="days_inactive">days_inactive</SelectItem>
                          <SelectItem value="goal_remaining">goal_remaining</SelectItem>
                          <SelectItem value="quiz_count">quiz_count</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={cond.operator}
                        onValueChange={(val) => val && handleUpdateCondition(idx, "operator", val)}
                      >
                        <SelectTrigger className="w-[90px] h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="==">== (Bằng)</SelectItem>
                          <SelectItem value="!=">!= (Khác)</SelectItem>
                          <SelectItem value=">">&gt; (Lớn hơn)</SelectItem>
                          <SelectItem value=">=">&gt;= (Lớn hơn bằng)</SelectItem>
                          <SelectItem value="<">&lt; (Nhỏ hơn)</SelectItem>
                          <SelectItem value="<=">&lt;= (Nhỏ hơn bằng)</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={String(cond.value ?? "")}
                        onChange={(e) => handleUpdateCondition(idx, "value", e.target.value)}
                        placeholder="Giá trị"
                        className="h-8 text-xs rounded-lg flex-1"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveCondition(idx)}
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl text-xs gap-1.5 font-bold bg-[#f9971d] text-[#030f31] hover:bg-[#e08516]"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>{editingId ? "Lưu thay đổi" : "Tạo quy tắc"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* PREVIEW RECIPIENTS MODAL                                                  */}
      {/* ========================================================================= */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>Xem trước đối tượng phù hợp</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Hệ thống đánh giá toàn bộ học viên và hiển thị mẫu nội dung render thực tế của những người thỏa mãn điều kiện.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {previewLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Đang quét cơ sở dữ liệu và đánh giá điều kiện...</span>
              </div>
            ) : previewData ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Tổng số học viên đủ điều kiện nhận:</span>
                    <div className="text-xl font-extrabold text-primary">{previewData.totalEligible} học viên</div>
                  </div>
                  <Badge variant="outline" className="border-border text-[11px]">
                    Quy tắc: {previewData.ruleName}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground">Mẫu nội dung của 5 học viên đầu tiên:</span>
                  {previewData.samples.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Hiện không có học viên nào thỏa mãn tất cả các điều kiện của quy tắc này.
                    </div>
                  ) : (
                    previewData.samples.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {s.name} ({s.email})
                          </span>
                          <span className="font-mono text-[10px]">User ID: {s.userId.slice(0, 8)}...</span>
                        </div>
                        <div className="font-bold text-foreground">{s.renderedTitle}</div>
                        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {s.renderedBody}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* RUN RULE MODAL                                                            */}
      {/* ========================================================================= */}
      <Dialog open={runModalOpen} onOpenChange={setRunModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-500" />
              <span>Kích hoạt quy tắc tự động ngay</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Quy tắc: <strong className="text-foreground">{runningRuleName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {runResult ? (
              <div className="space-y-3 animate-in fade-in-50">
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    runResult.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-destructive/10 text-destructive border-destructive/30"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div className="space-y-1">
                    <div className="font-bold">Đã hoàn thành lượt chạy tự động!</div>
                    <div>Số người nhận đủ điều kiện: {runResult.eligibleRecipients}</div>
                    <div>Đã gửi In-app: {runResult.inAppSentCount} thông báo</div>
                    <div>Đã gửi Web Push: {runResult.pushSentCount} thiết bị</div>
                    <div>Bỏ qua do cooldown/tùy chọn: {runResult.skippedCount}</div>
                    {runResult.failedCount > 0 && <div>Lỗi: {runResult.failedCount}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Bạn có thể chọn <strong>Chạy thử (Dry Run)</strong> để kiểm tra số lượng học viên sẽ nhận thông báo mà không thực sự bắn thông báo, hoặc <strong>Bắn thật ngay</strong>.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px]">
                  Cơ chế chống spam và cooldown tự động bảo vệ: Những học viên vừa nhận thông báo trong vòng cooldown sẽ được tự động bỏ qua.
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRunModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Đóng
            </Button>
            {!runResult && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecuteRule(true)}
                  disabled={isRunning}
                  className="rounded-xl text-xs gap-1 border-border"
                >
                  {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  <span>Chạy thử (Dry run)</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleExecuteRule(false)}
                  disabled={isRunning}
                  className="rounded-xl text-xs gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Bắn thật ngay</span>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
