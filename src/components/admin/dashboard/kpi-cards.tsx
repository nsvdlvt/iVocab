import { DashboardMetricOverview } from "@/repositories/admin/dashboard.repository";
import { Users, Library, BookOpen, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCards({ metrics }: { metrics: DashboardMetricOverview }) {
  const cards = [
    {
      title: "Tổng Người dùng",
      value: metrics.totalUsers.toLocaleString("vi-VN"),
      subtitle: `+${metrics.newUsers7d} người dùng mới (7 ngày)`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Bộ từ vựng & Từ vựng",
      value: `${metrics.totalVocabSets.toLocaleString("vi-VN")} bộ`,
      subtitle: `${metrics.totalVocabWords.toLocaleString("vi-VN")} từ vựng trong kho`,
      icon: Library,
      color: "text-[#f9971d]",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Nội dung Khám phá",
      value: `${metrics.totalCommunitySets} bộ CĐ`,
      subtitle: `${metrics.totalReadingArticles} bài đọc song ngữ`,
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Hoạt động Học tập",
      value: `${metrics.totalStudySessions.toLocaleString("vi-VN")} phiên`,
      subtitle: `${metrics.totalQuizAttempts.toLocaleString("vi-VN")} bài kiểm tra đã làm`,
      icon: BrainCircuit,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="shadow-xs border-border/80 hover:border-border transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-2xl ${card.bgColor} ${card.color} ${card.borderColor} border shrink-0`}>
              <card.icon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
