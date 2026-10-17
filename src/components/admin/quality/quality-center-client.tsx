"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, AlertCircle, Info, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QualitySummary, QualityIssue } from "@/repositories/admin/quality.repository";
import { useRouter } from "next/navigation";

interface QualityCenterClientProps {
  summary: QualitySummary;
}

export function QualityCenterClient({ summary }: QualityCenterClientProps) {
  const router = useRouter();
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredIssues = summary.issues.filter((issue) => {
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && issue.category !== filterCategory) return false;
    return true;
  });

  const getSeverityBadge = (sev: "high" | "medium" | "low") => {
    switch (sev) {
      case "high":
        return <Badge className="bg-destructive text-destructive-foreground text-[10px]">Nghiêm trọng (High)</Badge>;
      case "medium":
        return <Badge className="bg-amber-500 text-white text-[10px]">Cảnh báo (Medium)</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-[10px]">Nhắc nhở (Low)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Health Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Chỉ số Sức khỏe Dữ liệu</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{summary.overallScore} / 100</p>
              <p className="text-xs text-muted-foreground">Điểm chuẩn chất lượng</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lỗi Nghiêm trọng (High)</p>
              <p className="text-2xl font-bold text-destructive mt-0.5">{summary.highSeverityCount}</p>
              <p className="text-xs text-muted-foreground">Thiếu nghĩa, thiếu bản dịch</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cảnh báo (Medium)</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{summary.mediumSeverityCount}</p>
              <p className="text-xs text-muted-foreground">Thiếu IPA, từ trùng lặp</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nhắc nhở (Low)</p>
              <p className="text-2xl font-bold text-blue-500 mt-0.5">{summary.lowSeverityCount}</p>
              <p className="text-xs text-muted-foreground">Chưa có câu ví dụ</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Info className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
          >
            <option value="all">Mọi mức độ nghiêm trọng</option>
            <option value="high">Chỉ lỗi Nghiêm trọng (High)</option>
            <option value="medium">Chỉ Cảnh báo (Medium)</option>
            <option value="low">Chỉ Nhắc nhở (Low)</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
          >
            <option value="all">Mọi danh mục dữ liệu</option>
            <option value="vocabulary">Từ vựng (Vocabulary)</option>
            <option value="vocab_set">Bộ từ vựng (Sets)</option>
            <option value="reading">Bài đọc song ngữ (Reading)</option>
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Chạy lại Soát lỗi
        </Button>
      </div>

      {/* Issues Table */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#f9971d]" />
            Danh sách Vấn đề Cần Khắc phục ({filteredIssues.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Bấm vào liên kết để chuyển ngay đến mục tương ứng và bổ sung dữ liệu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold text-foreground">Không phát hiện vấn đề nào!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dữ liệu học tập đạt tiêu chuẩn chất lượng cao.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(issue.severity)}
                      <span className="font-bold text-sm text-foreground">{issue.title}</span>
                      <span className="text-muted-foreground">({issue.recordName})</span>
                    </div>
                    <p className="text-muted-foreground">{issue.description}</p>
                  </div>
                  <Link
                    href={issue.editUrl}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 shrink-0 text-xs")}
                  >
                    Khắc phục ngay <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
