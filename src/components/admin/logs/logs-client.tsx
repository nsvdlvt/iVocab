"use client";

import { useState } from "react";
import { 
  Activity, 
  Database as DbIcon, 
  HardDrive, 
  Sparkles, 
  BookA, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Clock,
  User,
  Filter,
  ChevronRight,
  Code2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SystemHealthResult } from "@/repositories/admin/health.repository";
import { FallbackAuditLog } from "@/lib/admin/fallback-store";
import { useRouter } from "next/navigation";

interface LogsClientProps {
  healthChecks: SystemHealthResult[];
  logs: FallbackAuditLog[];
  totalLogs: number;
  isDatabaseLive?: boolean;
}

export function LogsClient({ healthChecks, logs, totalLogs, isDatabaseLive = true }: LogsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<FallbackAuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== "all" && log.entity_type !== entityFilter) return false;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const matchActor = (log.actor_email || "").toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = (log.entity_id || "").toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchEntity) return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "Database":
        return <DbIcon className="h-4 w-4 text-blue-500" />;
      case "Storage":
        return <HardDrive className="h-4 w-4 text-purple-500" />;
      case "Gemini AI":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case "Dictionary API":
        return <BookA className="h-4 w-4 text-emerald-500" />;
      default:
        return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("delete")) {
      return <Badge variant="destructive" className="text-[10px] font-mono">{action}</Badge>;
    }
    if (action.includes("create")) {
      return <Badge className="bg-emerald-600 text-white text-[10px] font-mono">{action}</Badge>;
    }
    if (action.includes("toggle") || action.includes("change")) {
      return <Badge className="bg-amber-500 text-white text-[10px] font-mono">{action}</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] font-mono">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {!isDatabaseLive && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold">Bảng nhật ký kiểm toán `admin_audit_logs` chưa được khởi tạo trên Supabase</p>
            <p className="text-xs opacity-90">
              Nhật ký hiện đang được lưu tạm thời. Hãy thực thi migration SQL{" "}
              <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-[11px]">
                supabase/migrations/20261017_admin_console_tables_and_policies.sql
              </code>{" "}
              trong Supabase SQL Editor để kích hoạt lưu trữ vĩnh viễn trên production.
            </p>
          </div>
        </div>
      )}

      {/* System Health Status Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Trạng thái Dịch vụ & Độ trễ (Operational Health)
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs text-muted-foreground h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Kiểm tra lại
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthChecks.map((srv) => (
            <Card key={srv.service} className="shadow-xs border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60">
                    {getServiceIcon(srv.service)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{srv.service}</div>
                    <div className="text-xs text-muted-foreground">
                      {srv.latencyMs !== undefined ? `${srv.latencyMs}ms` : "Không khả dụng"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {getStatusIcon(srv.status)}
                  <span className="text-xs font-semibold capitalize text-foreground">
                    {srv.status === "healthy" ? "Hoạt động" : srv.status === "degraded" ? "Chậm" : "Lỗi"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Nhật ký Hoạt động Quản trị (Audit Trail)</h2>
            <p className="text-xs text-muted-foreground">
              Toàn bộ các hành động thay đổi quyền hạn, xóa nội dung, cập nhật cấu hình hoặc kích hoạt tính năng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm actor, action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="all">Tất cả thực thể</option>
              <option value="user">Người dùng (user)</option>
              <option value="vocab_set">Bộ từ vựng (vocab_set)</option>
              <option value="reading">Bài đọc (reading)</option>
              <option value="announcement">Thông báo (announcement)</option>
              <option value="feature_flag">Cờ tính năng (feature_flag)</option>
              <option value="settings">Cài đặt (settings)</option>
            </select>
          </div>
        </div>

        {/* Logs Table / List */}
        <Card className="shadow-xs border-border/80 overflow-hidden">
          <div className="divide-y divide-border/60">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Không tìm thấy bản ghi nhật ký kiểm toán phù hợp.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5 sm:mt-0">
                      <User className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{log.actor_email || "System"}</span>
                        {getActionBadge(log.action)}
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                          {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}
                        </Badge>
                      </div>

                      {selectedLog?.id === log.id && (
                        <div className="mt-2 p-3 bg-muted/60 rounded-md font-mono text-[11px] text-foreground border overflow-x-auto">
                          <div className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                            <Code2 className="h-3 w-3" /> Chi tiết Payload JSON:
                          </div>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 self-end sm:self-auto">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(log.created_at).toLocaleString("vi-VN")}</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${selectedLog?.id === log.id ? "rotate-90" : ""}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
