"use client";

import React, { useState } from "react";
import {
  Layers,
  Sliders,
  Send,
  Smartphone,
  Clock,
  Search,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  NotificationAutomationRunRow,
  NotificationDeliveryLogRow,
  AutomationDashboardStats,
} from "@/repositories/admin/notification-template.repository";

interface AutomationDashboardProps {
  stats: AutomationDashboardStats;
  runs: Array<NotificationAutomationRunRow & { rule_name?: string }>;
  logs: Array<
    NotificationDeliveryLogRow & {
      user_name?: string;
      user_email?: string;
      rule_name?: string;
    }
  >;
}

export function AutomationDashboard({
  stats,
  runs: initialRuns,
  logs: initialLogs,
}: AutomationDashboardProps) {
  const [runs] = useState(initialRuns);
  const [logs] = useState(initialLogs);
  const [logSearch, setLogSearch] = useState("");

  const filteredLogs = logs.filter((l) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase().trim();
    return (
      (l.user_name && l.user_name.toLowerCase().includes(q)) ||
      (l.user_email && l.user_email.toLowerCase().includes(q)) ||
      (l.rendered_title && l.rendered_title.toLowerCase().includes(q)) ||
      (l.rule_name && l.rule_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Templates */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">Mẫu thông báo</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-foreground">{stats.totalTemplates}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="text-emerald-500 font-bold">{stats.activeTemplates} mẫu</span> đang kích hoạt (Active)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Automation Rules */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">Quy tắc tự động</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sliders className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-foreground">{stats.totalRules}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="text-primary font-bold">{stats.activeRules} quy tắc</span> đang tự động chạy
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Sent */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">Thông báo đã gửi</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Send className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-foreground">{stats.totalSent}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats.totalFailed > 0 ? (
                <span className="text-destructive font-semibold">{stats.totalFailed} lần gửi lỗi</span>
              ) : (
                <span className="text-emerald-500 font-semibold">100% tỷ lệ phân phối</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Web Push Subscribers */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">Web Push Active</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Smartphone className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-foreground">{stats.totalSubscribers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Thiết bị đã đăng ký nhận Web Push
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Runs Table */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Lịch sử các phiên chạy tự động (Automation Runs)</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Ghi nhận chi tiết từng lần scheduler / worker kích hoạt quy tắc gửi thông báo.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {runs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Chưa có phiên chạy tự động nào được ghi nhận.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th className="p-3.5 pl-4">Quy tắc</th>
                  <th className="p-3.5">Trigger</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-center">Đủ ĐK</th>
                  <th className="p-3.5 text-center">In-App</th>
                  <th className="p-3.5 text-center">Web Push</th>
                  <th className="p-3.5 text-center">Bỏ qua</th>
                  <th className="p-3.5">Thời điểm chạy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-4 font-semibold text-foreground">
                      {r.rule_name || "Quy tắc không xác định"}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-mono border-border">
                        {r.trigger_type}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          r.status === "completed"
                            ? "default"
                            : r.status === "running"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center font-bold text-foreground">
                      {r.eligible_recipients}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {r.in_app_sent_count}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-purple-600 dark:text-purple-400">
                      {r.push_sent_count}
                    </td>
                    <td className="p-3.5 text-center text-muted-foreground">
                      {r.skipped_count}
                    </td>
                    <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                      {new Date(r.started_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Per-User Delivery Logs Table */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Nhật ký gửi thông báo cho từng học viên (Delivery Logs & Idempotency)</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Danh sách các thông báo đã render và chuyển phát thực tế đến từng tài khoản.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo học viên, tiêu đề..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-8 h-8 rounded-xl text-xs bg-background"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Không tìm thấy nhật ký gửi nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th className="p-3.5 pl-4">Học viên nhận</th>
                  <th className="p-3.5">Tiêu đề đã render</th>
                  <th className="p-3.5">Kênh</th>
                  <th className="p-3.5">In-App</th>
                  <th className="p-3.5">Web Push</th>
                  <th className="p-3.5">Idempotency Key</th>
                  <th className="p-3.5">Thời điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="font-bold text-foreground">{log.user_name || "Học viên"}</div>
                      <div className="text-[10px] text-muted-foreground">{log.user_email}</div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-foreground truncate">{log.rendered_title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{log.rendered_body}</div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-border">
                        {log.channel}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          log.in_app_status === "sent"
                            ? "default"
                            : log.in_app_status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {log.in_app_status || "none"}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          log.push_status === "sent"
                            ? "default"
                            : log.push_status === "failed" || log.push_status === "expired"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {log.push_status || "none"}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {log.idempotency_key}
                    </td>
                    <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
