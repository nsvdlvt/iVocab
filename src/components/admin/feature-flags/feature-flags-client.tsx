"use client";

import { useState } from "react";
import { 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Mic, 
  BookOpen, 
  Sliders,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { FallbackFeatureFlag } from "@/lib/admin/fallback-store";
import { toggleFeatureFlagAction } from "@/actions/admin/feature-flags";
import { useRouter } from "next/navigation";

interface FeatureFlagsClientProps {
  initialFlags: FallbackFeatureFlag[];
  isDatabaseLive?: boolean;
}

export function FeatureFlagsClient({ initialFlags, isDatabaseLive = true }: FeatureFlagsClientProps) {
  const router = useRouter();
  const [flags, setFlags] = useState<FallbackFeatureFlag[]>(initialFlags);
  const [search, setSearch] = useState("");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const maintenanceFlag = flags.find((f) => f.key === "maintenance_mode");

  const filteredFlags = flags.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.key.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    const nextVal = !currentEnabled;
    
    // Safety check for maintenance mode
    if (key === "maintenance_mode" && nextVal) {
      if (!confirm("CẢNH BÁO: Kích hoạt Chế độ Bảo trì sẽ khóa truy cập của tất cả học viên thông thường. Bạn có chắc chắn muốn tiếp tục?")) {
        return;
      }
    }

    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, is_enabled: nextVal } : f))
    );

    try {
      setTogglingKey(key);
      const res = await toggleFeatureFlagAction(key, nextVal);
      if (!res.ok) {
        // Revert optimistic update on failure
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, is_enabled: currentEnabled } : f))
        );
        alert(res.error || "Không thể cập nhật cờ tính năng");
        router.refresh();
      }
    } finally {
      setTogglingKey(null);
    }
  };

  const getFlagIcon = (key: string) => {
    switch (key) {
      case "gemini_flash_assistance":
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case "azure_speech_assessment":
        return <Mic className="h-5 w-5 text-blue-500" />;
      case "bilingual_reading":
        return <BookOpen className="h-5 w-5 text-emerald-500" />;
      case "maintenance_mode":
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      default:
        return <Sliders className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Emergency Alert Banner if Enabled */}
      {maintenanceFlag && maintenanceFlag.is_enabled && (
        <Card className="border-destructive/50 bg-destructive/10 shadow-sm animate-pulse">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-destructive">
                  HỆ THỐNG ĐANG BẬT CHẾ ĐỘ BẢO TRÌ (MAINTENANCE MODE)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tất cả người dùng thông thường sẽ nhìn thấy thông báo bảo trì. Chỉ các tài khoản quản trị viên mới có thể truy cập hệ thống.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleToggle("maintenance_mode", true)}
              className="font-bold shrink-0"
            >
              Tắt bảo trì ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Danh sách Cờ Tính Năng (Feature Flags)</h2>
          <p className="text-xs text-muted-foreground">
            Bật hoặc tắt tức thì các tính năng trên nền tảng mà không cần triển khai lại mã nguồn (Zero-downtime control).
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Flags List */}
      <div className="grid gap-4">
        {filteredFlags.map((flag) => {
          const isMaint = flag.key === "maintenance_mode";
          return (
            <Card
              key={flag.key}
              className={`shadow-xs border-border/80 transition-colors ${
                isMaint && flag.is_enabled ? "border-destructive/40 bg-destructive/5" : ""
              }`}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    {getFlagIcon(flag.key)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{flag.name}</h3>
                      <code className="text-[11px] px-1.5 py-0.5 bg-muted rounded font-mono text-muted-foreground">
                        {flag.key}
                      </code>
                      {flag.is_enabled ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Đã tắt
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {flag.description || "Không có mô tả chi tiết."}
                    </p>

                    <div className="text-[11px] text-muted-foreground/80 pt-1">
                      Môi trường: <span className="font-semibold text-foreground">{flag.environment}</span> • Cập nhật lần cuối:{" "}
                      {new Date(flag.updated_at).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 justify-between sm:justify-end">
                  <span className="text-xs font-medium text-muted-foreground">
                    {flag.is_enabled ? "BẬT" : "TẮT"}
                  </span>
                  <Switch
                    checked={flag.is_enabled}
                    disabled={togglingKey === flag.key}
                    onCheckedChange={() => handleToggle(flag.key, flag.is_enabled)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
