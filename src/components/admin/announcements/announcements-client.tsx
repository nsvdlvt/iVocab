"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Radio, 
  Eye, 
  Loader2,
  Calendar,
  ExternalLink,
  Edit,
  Send,
  Archive,
  Users,
  ShieldAlert,
  ArrowRight,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { FallbackAnnouncement } from "@/lib/admin/fallback-store";
import { 
  createAnnouncementAction, 
  updateAnnouncementAction,
  publishAnnouncementAction,
  archiveAnnouncementAction,
  deleteAnnouncementAction,
  getAudienceEstimateAction,
  CreateAnnouncementPayload
} from "@/actions/admin/announcements";
import { useRouter } from "next/navigation";

interface AnnouncementsClientProps {
  initialAnnouncements: FallbackAnnouncement[];
  isDatabaseLive?: boolean;
}

export function AnnouncementsClient({ initialAnnouncements, isDatabaseLive = true }: AnnouncementsClientProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<FallbackAnnouncement[]>(initialAnnouncements);
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft" | "archived">("all");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal state
  const [editingAnnouncement, setEditingAnnouncement] = useState<FallbackAnnouncement | null>(null);

  // Deleting / Publishing state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Audience & Push estimate state
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [pushSubscribersCount, setPushSubscribersCount] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formType, setFormType] = useState<"info" | "warning" | "success" | "broadcast">("info");
  const [formPriority, setFormPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [formAudience, setFormAudience] = useState<"all" | "free" | "premium" | "admin">("all");
  const [formDeliveryChannels, setFormDeliveryChannels] = useState<"in_app" | "push" | "both">("both");
  const [formActionUrl, setFormActionUrl] = useState("");
  const [formPublishImmediately, setFormPublishImmediately] = useState(true);

  // Sync initial data
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  // Load audience estimate when audience changes
  useEffect(() => {
    let isMounted = true;
    async function fetchEstimate() {
      setLoadingEstimate(true);
      const res = await getAudienceEstimateAction(formAudience);
      if (isMounted && res.ok && typeof res.count === "number") {
        setAudienceCount(res.count);
        if (typeof (res as any).pushSubscribersCount === "number") {
          setPushSubscribersCount((res as any).pushSubscribersCount);
        }
      }
      setLoadingEstimate(false);
    }
    fetchEstimate();
    return () => { isMounted = false; };
  }, [formAudience]);

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormSummary("");
    setFormType("info");
    setFormPriority("normal");
    setFormAudience("all");
    setFormDeliveryChannels("both");
    setFormActionUrl("");
    setFormPublishImmediately(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (ann: FallbackAnnouncement) => {
    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormSummary(ann.summary || "");
    setFormType(ann.type);
    setFormPriority(ann.priority || "normal");
    setFormAudience(ann.target_audience);
    setFormDeliveryChannels(ann.delivery_channels || "in_app");
    setFormActionUrl(ann.action_url || "");
    setFormPublishImmediately(ann.status === "published" || ann.is_active);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      setIsSubmitting(true);
      const status = formPublishImmediately ? "published" : "draft";
      const payload: CreateAnnouncementPayload = {
        title: formTitle,
        content: formContent,
        summary: formSummary || null,
        type: formType,
        priority: formPriority,
        target_audience: formAudience,
        status,
        delivery_channels: formDeliveryChannels,
        action_url: formActionUrl || null,
      };

      const res = await createAnnouncementAction(payload);
      if (res.ok) {
        setIsCreateOpen(false);
        resetForm();
        if ((res as any).pushSummary) {
          const s = (res as any).pushSummary;
          alert(`Đã tạo thông báo! Kết quả Web Push: ${s.accepted}/${s.attempted} thiết bị nhận thành công.`);
        }
        router.refresh();
      } else {
        alert("Lỗi khi tạo thông báo: " + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    if (!formTitle.trim() || !formContent.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateAnnouncementAction(editingAnnouncement.id, {
        title: formTitle,
        content: formContent,
        summary: formSummary || null,
        type: formType,
        priority: formPriority,
        target_audience: formAudience,
        action_url: formActionUrl || null,
      });

      if (res.ok) {
        setEditingAnnouncement(null);
        resetForm();
        router.refresh();
      } else {
        alert("Lỗi khi cập nhật thông báo: " + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn phát hành thông báo này ngay tới người dùng (bao gồm Web Push nếu đã cấu hình)?")) return;
    try {
      setActionLoadingId(id);
      const res = await publishAnnouncementAction(id, { sendPush: true });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "published", is_active: true } : a))
        );
        if ((res as any).pushSummary) {
          const s = (res as any).pushSummary;
          alert(`Đã phát hành thông báo! Web Push: ${s.accepted}/${s.attempted} thiết bị nhận thành công.`);
        }
        router.refresh();
      } else {
        alert("Lỗi khi phát hành: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Bạn có chắc muốn chuyển thông báo này vào mục Lưu trữ? Người học sẽ không còn nhìn thấy nữa.")) return;
    try {
      setActionLoadingId(id);
      const res = await archiveAnnouncementAction(id);
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "archived", is_active: false } : a))
        );
        router.refresh();
      } else {
        alert("Lỗi khi lưu trữ: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn thông báo này không? Thao tác này không thể hoàn tác.")) return;

    try {
      setActionLoadingId(id);
      const res = await deleteAnnouncementAction(id);
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      } else {
        alert("Lỗi khi xóa: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "warning":
        return <Badge className="bg-amber-500 text-white text-[10px] flex items-center gap-1 font-semibold"><AlertTriangle className="h-3 w-3" /> Cảnh báo</Badge>;
      case "success":
        return <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1 font-semibold"><CheckCircle2 className="h-3 w-3" /> Thành công</Badge>;
      case "broadcast":
        return <Badge className="bg-purple-600 text-white text-[10px] flex items-center gap-1 font-semibold"><Radio className="h-3 w-3" /> Toàn hệ thống</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] flex items-center gap-1 font-semibold"><Info className="h-3 w-3" /> Tin tức</Badge>;
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case "urgent":
        return <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">Khẩn cấp</Badge>;
      case "high":
        return <Badge className="bg-orange-500 text-white text-[10px] font-semibold">Ưu tiên cao</Badge>;
      case "low":
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">Thấp</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Bình thường</Badge>;
    }
  };

  const getAudienceBadge = (aud: string) => {
    switch (aud) {
      case "free":
      case "premium":
        return <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-semibold">Học viên</Badge>;
      case "admin":
        return <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive font-semibold">Quản trị viên</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Tất cả người dùng</Badge>;
    }
  };

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case "push":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 border-sky-500/30 text-sky-600 dark:text-sky-400">
            <Smartphone className="h-3 w-3" />
            Chỉ Push
          </Badge>
        );
      case "both":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold">
            <Radio className="h-3 w-3" />
            In-App & Push
          </Badge>
        );
      case "in_app":
      default:
        return (
          <Badge variant="outline" className="text-[10px] gap-1 border-border text-muted-foreground">
            <Bell className="h-3 w-3" />
            In-App
          </Badge>
        );
    }
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    const s = status || (isActive ? "published" : "draft");
    switch (s) {
      case "published":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">Đã phát hành</Badge>;
      case "draft":
        return <Badge variant="secondary" className="text-[10px] font-medium">Bản nháp</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">Lưu trữ</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">Lên lịch</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const s = a.status || (a.is_active ? "published" : "draft");
    if (activeTab === "all") return true;
    if (activeTab === "published") return s === "published";
    if (activeTab === "draft") return s === "draft";
    if (activeTab === "archived") return s === "archived";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Quản trị Thông báo & Truyền thông In-App</h2>
          <p className="text-xs text-muted-foreground">
            Tạo thông báo tin tức, lịch bảo trì hoặc cập nhật tính năng trực tiếp tới thanh thông báo của người học.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo thông báo mới
        </Button>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="all" className="text-xs font-semibold">
            Tất cả ({announcements.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="text-xs font-semibold">
            Đang phát hành ({announcements.filter((a) => (a.status || (a.is_active ? "published" : "draft")) === "published").length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs font-semibold">
            Bản nháp ({announcements.filter((a) => (a.status || (a.is_active ? "published" : "draft")) === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs font-semibold">
            Lưu trữ ({announcements.filter((a) => a.status === "archived").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Announcements List */}
      <div className="grid gap-4">
        {filteredAnnouncements.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-foreground">Không có thông báo nào trong mục này</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Bạn có thể tạo thông báo mới hoặc chuyển đổi giữa các tab bộ lọc phía trên.
            </p>
          </Card>
        ) : (
          filteredAnnouncements.map((ann) => {
            const isPublished = (ann.status || (ann.is_active ? "published" : "draft")) === "published";
            const isDraft = (ann.status || (ann.is_active ? "published" : "draft")) === "draft";
            const isLoading = actionLoadingId === ann.id;

            return (
              <Card key={ann.id} className="shadow-xs border-border/80 hover:border-border transition-all">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(ann.status, ann.is_active)}
                      {getTypeBadge(ann.type)}
                      {getPriorityBadge(ann.priority)}
                      {getAudienceBadge(ann.target_audience)}
                      {getChannelBadge(ann.delivery_channels)}
                    </div>

                    <h3 className="text-base font-bold text-foreground">{ann.title}</h3>

                    {ann.summary && (
                      <p className="text-xs font-medium text-foreground/80 italic">{ann.summary}</p>
                    )}

                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {ann.content}
                    </p>

                    {ann.action_url && (
                      <div className="pt-1">
                        <a
                          href={ann.action_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Liên kết đính kèm: <span className="font-mono">{ann.action_url}</span>
                        </a>
                      </div>
                    )}

                    {typeof ann.push_attempt_count === "number" && ann.push_attempt_count > 0 && (
                      <div className="flex items-center gap-2 text-xs bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md border border-sky-500/20 w-fit">
                        <Smartphone className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Web Push: <strong>{ann.push_success_count ?? 0}</strong> / {ann.push_attempt_count} thiết bị nhận thành công
                          {Boolean(ann.push_failure_count && ann.push_failure_count > 0) && (
                            <span className="text-destructive ml-1">({ann.push_failure_count} lỗi)</span>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Tạo lúc: {new Date(ann.created_at).toLocaleString("vi-VN")}
                      </span>
                      {ann.published_at && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Send className="h-3 w-3" />
                          Phát hành: {new Date(ann.published_at).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 justify-end">
                    {isDraft && (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handlePublish(ann.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs cursor-pointer"
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                        Phát hành ngay
                      </Button>
                    )}

                    {isPublished && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleArchive(ann.id)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Archive className="h-3.5 w-3.5 mr-1" />
                        Lưu trữ
                      </Button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleOpenEdit(ann)}
                        className="h-8 px-2 text-xs hover:bg-muted cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Sửa
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        onClick={() => handleDelete(ann.id)}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Tạo Thông Báo Mới</DialogTitle>
              <DialogDescription className="text-xs">
                Soạn thảo thông báo tới học viên, lựa chọn đối tượng và phát hành ngay hoặc lưu nháp.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tiêu đề thông báo *</label>
                <Input
                  placeholder="VD: Cập nhật tính năng Đọc song ngữ mới..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tóm tắt ngắn (Tùy chọn)</label>
                <Input
                  placeholder="Tóm tắt 1 dòng ngắn gọn hiển thị trong popup..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  maxLength={150}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nội dung chi tiết *</label>
                <Textarea
                  placeholder="Nhập nội dung thông báo đầy đủ gửi tới học viên..."
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  maxLength={3000}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Loại thông báo</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                  >
                    <option value="info">Thông tin (Info)</option>
                    <option value="warning">Cảnh báo (Warning)</option>
                    <option value="success">Thành công (Success)</option>
                    <option value="broadcast">Phát sóng khẩn (Broadcast)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Độ ưu tiên</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                  >
                    <option value="low">Thấp</option>
                    <option value="normal">Bình thường</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Đối tượng nhận</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                  >
                    <option value="all">Tất cả người dùng (All)</option>
                    <option value="free">Học viên (Learners)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Delivery Channels Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Kênh phân phối (Delivery Channels)</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formDeliveryChannels}
                  onChange={(e) => setFormDeliveryChannels(e.target.value as any)}
                >
                  <option value="both">Cả hai (In-App Notification & Browser Web Push)</option>
                  <option value="in_app">Chỉ thông báo trong ứng dụng (In-App only)</option>
                  <option value="push">Chỉ Browser Web Push (Desktop & Mobile)</option>
                </select>
              </div>

              {/* Audience & Push Estimate Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Học viên nhận:{" "}
                    <strong className="text-foreground">
                      {loadingEstimate ? "Đang tính..." : `${audienceCount ?? 0} tài khoản`}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    Thiết bị Push sẵn sàng:{" "}
                    <strong className="text-foreground">
                      {loadingEstimate ? "..." : `${pushSubscribersCount ?? 0} thiết bị`}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Đường dẫn liên kết (Tùy chọn)</label>
                <Input
                  placeholder="VD: /reading hoặc https://example.com"
                  value={formActionUrl}
                  onChange={(e) => setFormActionUrl(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng /) hoặc https://</p>
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">Phát hành ngay lập tức</div>
                  <div className="text-[11px] text-muted-foreground">
                    Bật để gửi ngay tới người dùng; Tắt để lưu dưới dạng Bản nháp
                  </div>
                </div>
                <Switch
                  checked={formPublishImmediately}
                  onCheckedChange={setFormPublishImmediately}
                />
              </div>

              {/* Live Preview Card */}
              {formTitle.trim() && (
                <div className="border border-dashed rounded-lg p-3.5 bg-muted/20 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-primary" /> Xem trước hiển thị người dùng:
                  </div>
                  <div className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    formType === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200" :
                    formType === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200" :
                    formType === "broadcast" ? "bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200" :
                    "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formTitle}</span>
                      {getPriorityBadge(formPriority)}
                    </div>
                    {formSummary && <p className="font-semibold text-xs opacity-90">{formSummary}</p>}
                    <p className="opacity-80 leading-relaxed whitespace-pre-wrap">{formContent}</p>
                    {formActionUrl && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary underline">
                          Khám phá ngay <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold">
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {formPublishImmediately ? "Phát hành thông báo" : "Lưu bản nháp"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={Boolean(editingAnnouncement)} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Chỉnh Sửa Thông Báo</DialogTitle>
              <DialogDescription className="text-xs">
                Cập nhật tiêu đề, nội dung và tùy chọn hiển thị của thông báo.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tiêu đề thông báo *</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tóm tắt ngắn (Tùy chọn)</label>
                <Input
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  maxLength={150}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nội dung chi tiết *</label>
                <Textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  maxLength={3000}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Loại thông báo</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                  >
                    <option value="info">Thông tin (Info)</option>
                    <option value="warning">Cảnh báo (Warning)</option>
                    <option value="success">Thành công (Success)</option>
                    <option value="broadcast">Phát sóng khẩn (Broadcast)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Độ ưu tiên</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                  >
                    <option value="low">Thấp</option>
                    <option value="normal">Bình thường</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Đối tượng nhận</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                  >
                    <option value="all">Tất cả người dùng (All)</option>
                    <option value="free">Học viên (Learners)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Đường dẫn liên kết (Tùy chọn)</label>
                <Input
                  value={formActionUrl}
                  onChange={(e) => setFormActionUrl(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingAnnouncement(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold">
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
