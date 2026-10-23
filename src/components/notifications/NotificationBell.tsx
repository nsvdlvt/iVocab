"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  getUserNotificationsAction, 
  getUnreadNotificationCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction
} from "@/actions/notifications";
import type { UserNotificationItem } from "@/repositories/user-notifications.repository";

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Poll unread count on mount and every 60 seconds
  useEffect(() => {
    let isMounted = true;

    async function fetchCount() {
      const res = await getUnreadNotificationCountAction();
      if (isMounted && res.ok && typeof res.count === "number") {
        setUnreadCount(res.count);
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 60000);

    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchItems() {
      setIsLoading(true);
      const res = await getUserNotificationsAction("all", 5);
      if (isMounted && res.ok && res.items) {
        setNotifications(res.items);
        if (typeof res.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        }
      }
      setIsLoading(false);
    }

    fetchItems();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string, actionUrl?: string | null) => {
    e.stopPropagation();

    // Optimistically mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await markNotificationAsReadAction(id);

    if (actionUrl) {
      setIsOpen(false);
      router.push(actionUrl);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsMarkingAll(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await markAllNotificationsAsReadAction();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "broadcast":
        return <Radio className="h-4 w-4 text-purple-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Thông báo"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
          isOpen && "bg-muted text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#f9971d] text-[10px] font-extrabold text-[#030f31] shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95 origin-top-right overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">Thông báo</h4>
              {unreadCount > 0 && (
                <Badge className="bg-[#f9971d]/20 text-[#f9971d] hover:bg-[#f9971d]/20 border-[#f9971d]/30 text-[10px] font-bold px-1.5 py-0">
                  {unreadCount} mới
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-foreground">Chưa có thông báo nào</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Bạn sẽ nhận được thông báo khi có tin tức mới hoặc bài học được cập nhật.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => handleMarkAsRead(e, item.id, item.action_url)}
                  className={cn(
                    "p-3.5 hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-3 relative",
                    !item.is_read && "bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  <div className="mt-0.5">{getTypeIcon(item.type)}</div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={cn(
                        "text-xs truncate",
                        !item.is_read ? "font-bold text-foreground" : "font-medium text-foreground/80"
                      )}>
                        {item.title}
                      </h5>
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#f9971d] shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.summary || item.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                      <span>{new Date(item.published_at).toLocaleDateString("vi-VN")}</span>
                      {item.action_url && (
                        <span className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                          Xem chi tiết <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-2.5 bg-muted/20 text-center">
            <Link
              href="/u/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Xem trung tâm thông báo</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
