"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DashboardMetricOverview, 
  ChartDataPoint 
} from "@/repositories/admin/dashboard.repository";
import { LineChartCard } from "@/components/admin/charts/line-chart-card";
import { BarChartCard } from "@/components/admin/charts/bar-chart-card";
import { 
  exportUsersCsvAction, 
  exportVocabSetsCsvAction, 
  exportVocabWordsCsvAction, 
  exportStudySessionsCsvAction 
} from "@/actions/admin/analytics";

interface AnalyticsClientProps {
  metrics: DashboardMetricOverview;
  userGrowth: ChartDataPoint[];
  vocabGrowth: ChartDataPoint[];
  studyActivity: ChartDataPoint[];
}

export function AnalyticsClient({
  metrics,
  userGrowth,
  vocabGrowth,
  studyActivity,
}: AnalyticsClientProps) {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const downloadCsv = (csvContent: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: "users" | "sets" | "words" | "sessions") => {
    try {
      setExportingType(type);
      setSuccessMessage(null);

      let res;
      if (type === "users") res = await exportUsersCsvAction();
      else if (type === "sets") res = await exportVocabSetsCsvAction();
      else if (type === "words") res = await exportVocabWordsCsvAction();
      else if (type === "sessions") res = await exportStudySessionsCsvAction();

      if (res && res.success) {
        downloadCsv(res.csv, res.filename);
        setSuccessMessage(`Đã xuất dữ liệu ${res.filename} thành công!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      alert("Lỗi khi xuất dữ liệu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Người dùng đăng ký</span>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{metrics.newUsers7d} người dùng mới trong 7 ngày
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng số từ vựng</span>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">{metrics.totalVocabWords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trong {metrics.totalVocabSets} bộ từ vựng
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Phiên học tập</span>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">{metrics.totalStudySessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phiên ôn tập Spaced Repetition
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Lượt làm bài kiểm tra</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">{metrics.totalQuizAttempts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trắc nghiệm & Luyện tập câu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export Bar */}
      <Card className="border-primary/20 bg-primary/5 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Xuất dữ liệu hệ thống (CSV Export)</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tải toàn bộ báo cáo phân tích định dạng chuẩn RFC 4180 để sử dụng trong Excel, Google Sheets hoặc BI Tools.
            </p>
            {successMessage && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {successMessage}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exportingType !== null}
              onClick={() => handleExport("users")}
              className="bg-card text-xs font-medium"
            >
              {exportingType === "users" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              )}
              DS Người dùng
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={exportingType !== null}
              onClick={() => handleExport("sets")}
              className="bg-card text-xs font-medium"
            >
              {exportingType === "sets" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              )}
              Bộ từ vựng
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={exportingType !== null}
              onClick={() => handleExport("words")}
              className="bg-card text-xs font-medium"
            >
              {exportingType === "words" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              )}
              Kho từ vựng
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={exportingType !== null}
              onClick={() => handleExport("sessions")}
              className="bg-card text-xs font-medium"
            >
              {exportingType === "sessions" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              )}
              Phiên học SRS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Tăng trưởng Người học (14 ngày qua)"
          description="Số lượng tài khoản đăng ký mới theo ngày trên nền tảng"
          data={userGrowth}
          xAxisKey="date"
          lineDataKey="count"
        />

        <BarChartCard
          title="Từ vựng mới được thêm (14 ngày qua)"
          description="Số lượng thẻ từ vựng người dùng và hệ thống tạo mới"
          data={vocabGrowth}
          xAxisKey="date"
          barDataKey="count"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <LineChartCard
          title="Mức độ tương tác & Phiên học tập (14 ngày qua)"
          description="Tổng số phiên ôn tập từ vựng Spaced Repetition thực hiện mỗi ngày"
          data={studyActivity}
          xAxisKey="date"
          lineDataKey="count"
        />
      </div>
    </div>
  );
}
