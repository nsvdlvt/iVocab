import type { Metadata } from "next";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BrainCircuit, Clock, AlertTriangle, CheckCircle2, TrendingUp, BookOpen, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminSrsRepository } from "@/repositories/admin/srs.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Tiến độ Học tập & Spaced Repetition | Vocabee Admin",
  description: "Báo cáo thuật toán lặp lại ngắt quãng (SRS), khối lượng ôn tập và các phiên học tập.",
};

export default async function AdminSrsPage() {
  await requireAdmin();

  const [srsStats, sessionsResult] = await Promise.all([
    AdminSrsRepository.getSrsOverview(),
    AdminSrsRepository.getRecentStudySessions(1, 15),
  ]);

  const { statusBreakdown } = srsStats;
  const totalInBreakdown =
    statusBreakdown.new + statusBreakdown.learning + statusBreakdown.review + statusBreakdown.mastered || 1;

  const pctNew = Math.round((statusBreakdown.new / totalInBreakdown) * 100);
  const pctLearning = Math.round((statusBreakdown.learning / totalInBreakdown) * 100);
  const pctReview = Math.round((statusBreakdown.review / totalInBreakdown) * 100);
  const pctMastered = Math.round((statusBreakdown.mastered / totalInBreakdown) * 100);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Trung tâm Tiến độ Học & Spaced Repetition (SRS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi phân bổ thuật toán SuperMemo/SM-2, lượt ôn tập đến hạn và chất lượng ghi nhớ từ vựng.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cần Ôn tập Hôm nay</p>
              <p className="text-2xl font-bold text-[#f9971d] mt-0.5">{srsStats.dueToday.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Lượt học đến hạn</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-[#f9971d]">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ôn tập Quá hạn</p>
              <p className="text-2xl font-bold text-destructive mt-0.5">{srsStats.overdue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Cần gửi nhắc nhở</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hệ số Dễ (Ease Factor)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{srsStats.averageEaseFactor}</p>
              <p className="text-xs text-muted-foreground">Chuẩn SM-2 (2.50)</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Từ đã Nhớ (Ghi nhớ)</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {srsStats.totalWordsRemembered.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Từ được đánh giá nhớ</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SRS Distribution Stages */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#f9971d]" />
            Phân bổ Giai đoạn Ghi nhớ Từ vựng (SRS Memory Stages)
          </CardTitle>
          <CardDescription className="text-xs">
            Trạng thái phân bố theo số lần lặp lại và chu kỳ ngắt quãng trong cơ sở dữ liệu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">1. Từ mới (New)</p>
              <p className="text-xl font-bold text-foreground mt-1">{statusBreakdown.new.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{pctNew}% kho từ</p>
            </div>

            <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">2. Đang học (Learning)</p>
              <p className="text-xl font-bold text-foreground mt-1">{statusBreakdown.learning.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{pctLearning}% kho từ</p>
            </div>

            <div className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">3. Ôn tập đều (Review)</p>
              <p className="text-xl font-bold text-foreground mt-1">{statusBreakdown.review.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{pctReview}% kho từ</p>
            </div>

            <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">4. Đã thành thạo (Mastered)</p>
              <p className="text-xl font-bold text-foreground mt-1">{statusBreakdown.mastered.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{pctMastered}% kho từ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Study Sessions Table */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Nhật ký Phiên học tập Gần đây
          </CardTitle>
          <CardDescription className="text-xs">
            Các phiên hoàn thành flashcard, bài tập ngữ cảnh và ôn tập thực tế
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsResult.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chưa có phiên học nào được ghi nhận.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Học viên</th>
                    <th className="px-4 py-3">Từ đã học</th>
                    <th className="px-4 py-3">Từ nhớ được</th>
                    <th className="px-4 py-3">Thời lượng</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sessionsResult.data.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {s.profiles?.display_name || s.profiles?.email || s.user_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{s.studied_words || 0} từ</Badge>
                      </td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {s.remembered_words || 0} từ
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {Math.round((s.study_seconds || 0) / 60)} phút
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(s.started_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
