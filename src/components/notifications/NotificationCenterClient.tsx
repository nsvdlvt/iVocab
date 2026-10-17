"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ExternalLink,
  EyeOff,
  AlertTriangle,
  AlertOctagon,
  Info,
  Radio,
  CheckCircle2,
  Clock,
  Search,
  X,
  Loader2,
  Calendar,
  Sparkles,
  Inbox,
  Filter,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UserNotificationItem } from "@/repositories/user-notifications.repository";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  dismissNotificationAction,
} from "@/actions/notifications";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";

interface NotificationCenterClientProps {
  initialItems: UserNotificationItem[];
  initialUnreadCount: number;
}

type TabKey = "all" | "unread" | "priority";

export function NotificationCenterClient({
  initialItems,
  initialUnreadCount,
}: NotificationCenterClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<UserNotificationItem[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showPushSettings, setShowPushSettings] = useState(false);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    let result = items;

    if (activeTab === "unread") {
      result = result.filter((item) => !item.is_read);
    } else if (activeTab === "priority") {
      result = result.filter(
        (item) =>
          item.priority === "urgent" ||
          item.priority === "high" ||
          item.type === "warning"
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q)) ||
          item.content.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeTab, searchQuery]);

  const priorityCount = useMemo(() => {
    return items.filter(
      (item) =>
        item.priority === "urgent" ||
        item.priority === "high" ||
        item.type === "warning"
    ).length;
  }, [items]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loadingActions[id]) return;

    // Optimistically update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    try {
      await markNotificationAsReadAction(id);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    const prevItems = [...items];
    const prevCount = unreadCount;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsAsReadAction();
      if (!res.ok) {
        // Rollback on error
        setItems(prevItems);
        setUnreadCount(prevCount);
      }
    } catch {
      setItems(prevItems);
      setUnreadCount(prevCount);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDismiss = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loadingActions[id]) return;

    const itemToDismiss = items.find((i) => i.id === id);
    const wasUnread = itemToDismiss && !itemToDismiss.is_read;

    // Optimistically remove from list
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    try {
      await dismissNotificationAction(id);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleActionClick = (e: React.MouseEvent, id: string, actionUrl: string) => {
    e.stopPropagation();
    handleMarkAsRead(id);
    router.push(actionUrl);
  };

  const renderPriorityBadge = (priority: UserNotificationItem["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="gap-1 font-semibold">
            <AlertOctagon className="h-3 w-3" />
            Khẩn cấp
          </Badge>
        );
      case "high":
        return (
          <Badge variant="warning" className="gap-1 font-semibold">
            <AlertTriangle className="h-3 w-3" />
            Ưu tiên cao
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" />
            Thông thường
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Bản tin
          </Badge>
        );
    }
  };

  const renderTypeBadge = (type: UserNotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Cảnh báo
          </Badge>
        );
      case "success":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Hoàn thành
          </Badge>
        );
      case "broadcast":
        return (
          <Badge variant="default" className="gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
            <Radio className="h-3 w-3" />
            Toàn hệ thống
          </Badge>
        );
      case "info":
      default:
        return (
          <Badge variant="info" className="gap-1">
            <Info className="h-3 w-3" />
            Tin tức
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Actions & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/65 rounded-xl border border-border w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Tất cả</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-bold text-muted-foreground">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "unread"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Chưa đọc</span>
            {unreadCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#f9971d]/20 font-bold text-[#f9971d]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("priority")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "priority"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Quan trọng</span>
            {priorityCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-bold text-amber-600 dark:text-amber-400">
                {priorityCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Action: Mark all as read & Push Settings Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPushSettings((prev) => !prev)}
            className="gap-1.5 rounded-xl text-xs font-semibold border-border cursor-pointer hover:bg-muted"
          >
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            <span>{showPushSettings ? "Đóng cài đặt Push" : "Thông báo đẩy"}</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="gap-2 rounded-xl text-xs font-semibold border-border cursor-pointer hover:bg-muted"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Đánh dấu tất cả đã đọc</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Web Push Settings Card */}
      {showPushSettings && (
        <div className="border border-border/80 rounded-2xl p-4 sm:p-5 bg-card text-card-foreground shadow-xs animate-in fade-in-50 zoom-in-98 duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2.5">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground">Cấu hình Web Push trên thiết bị này</h4>
              <p className="text-[11px] text-muted-foreground">
                Nhận thông báo nổi trên desktop và màn hình điện thoại ngay cả khi bạn không mở trang web Vocabee.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowPushSettings(false)}
              className="rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <PushNotificationSettings />
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Tìm kiếm thông báo theo tiêu đề hoặc nội dung..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-10 rounded-xl bg-card border-border"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground">
              {searchQuery ? (
                <Search className="h-6 w-6 opacity-60" />
              ) : activeTab === "unread" ? (
                <CheckCheck className="h-6 w-6 text-emerald-500 opacity-80" />
              ) : (
                <BellOff className="h-6 w-6 opacity-60" />
              )}
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-foreground">
                {searchQuery
                  ? "Không tìm thấy kết quả phù hợp"
                  : activeTab === "unread"
                  ? "Tuyệt vời! Bạn không có thông báo chưa đọc"
                  : activeTab === "priority"
                  ? "Không có thông báo quan trọng"
                  : "Chưa có thông báo nào"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? `Không có thông báo nào chứa từ khóa "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
                  : activeTab === "unread"
                  ? "Tất cả các thông báo mới đã được bạn xem qua. Chúng tôi sẽ báo cho bạn khi có cập nhật mới."
                  : "Hệ thống sẽ gửi thông báo đến bạn khi có bản tin học tập, tính năng mới hoặc thông điệp quan trọng."}
              </p>
            </div>

            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="rounded-xl text-xs mt-2"
              >
                Xóa bộ lọc tìm kiếm
              </Button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = Boolean(expandedItems[item.id]);
            const isProcessing = Boolean(loadingActions[item.id]);
            const hasLongContent = item.content && item.content.length > 180;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 bg-card p-4 sm:p-5 text-card-foreground shadow-2xs relative group",
                  !item.is_read
                    ? "border-primary/40 bg-gradient-to-r from-primary/5 via-card to-card dark:from-primary/10"
                    : "border-border/80 hover:border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Badges & Title */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.is_read && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#f9971d] bg-[#f9971d]/15 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f9971d] animate-pulse" />
                          Mới
                        </span>
                      )}
                      {renderPriorityBadge(item.priority)}
                      {renderTypeBadge(item.type)}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.published_at)}
                      </span>
                    </div>

                    <h2
                      className={cn(
                        "text-sm sm:text-base tracking-tight leading-snug",
                        !item.is_read
                          ? "font-bold text-foreground"
                          : "font-semibold text-foreground/85"
                      )}
                    >
                      {item.title}
                    </h2>

                    {item.summary && (
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {item.summary}
                      </p>
                    )}

                    {/* Content */}
                    <div className="text-xs text-foreground/80 leading-relaxed pt-1">
                      {hasLongContent && !isExpanded ? (
                        <div>
                          <p className="line-clamp-2">{item.content}</p>
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="text-primary hover:underline font-semibold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            Xem thêm chi tiết
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-line">{item.content}</p>
                          {hasLongContent && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="text-primary hover:underline font-semibold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              Thu gọn
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Dismiss Quick Button */}
                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Ẩn thông báo"
                      title="Ẩn thông báo này"
                      onClick={(e) => handleDismiss(item.id, e)}
                      disabled={isProcessing}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {!item.is_read ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        disabled={isProcessing}
                        className="rounded-xl text-xs gap-1.5 h-8 border-border cursor-pointer hover:bg-muted"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                        <span>Đánh dấu đã đọc</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        Đã xem
                      </span>
                    )}
                  </div>

                  {item.action_url && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => handleActionClick(e, item.id, item.action_url!)}
                      className="rounded-xl text-xs gap-1.5 h-8 font-semibold cursor-pointer shadow-xs"
                    >
                      <span>Xem ngay</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
