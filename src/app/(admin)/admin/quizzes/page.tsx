import type { Metadata } from "next";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { HelpCircle, Award, Target, CheckCircle2, MessageSquareText } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminQuizRepository } from "@/repositories/admin/quiz.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Quản lý Kiểm tra & Bài tập | Vocabee Admin",
  description: "Báo cáo kết quả bài kiểm tra trắc nghiệm, bài tập đặt câu và dữ liệu học tập thực tế.",
};

export default async function AdminQuizzesPage() {
  await requireAdmin();

  const [overview, recentQuizzesResult, recentSentencesResult] = await Promise.all([
    AdminQuizRepository.getOverview(),
    AdminQuizRepository.getRecentQuizzes(1, 10),
    AdminQuizRepository.getRecentSentenceAttempts(1, 10),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý Kiểm tra & Bài tập Trắc nghiệm
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi phổ điểm, tỷ lệ hoàn thành bài kiểm tra và lịch sử luyện tập viết câu với AI.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tổng Bài kiểm tra</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{overview.totalQuizzes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{overview.totalQuestionsAnswered} câu đã trả lời</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Điểm số Trung bình</p>
              <p className="text-2xl font-bold text-[#f9971d] mt-0.5">{overview.averageScorePercentage}%</p>
              <p className="text-xs text-muted-foreground">Tỷ lệ chính xác toàn hệ thống</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-[#f9971d]">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Luyện Đặt câu (Writing)</p>
              <p className="text-2xl font-bold text-blue-500 mt-0.5">
                {overview.totalSentencePractices.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Lượt câu học viên viết</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <MessageSquareText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Điểm Viết câu TB</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {overview.avgSentenceScore}/100
              </p>
              <p className="text-xs text-muted-foreground">Ngữ pháp: {overview.avgGrammarScore} • Từ vựng: {overview.avgVocabularyScore}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-[#f9971d]" />
            Phổ Phân bổ Điểm số Kiểm tra (Score Distribution)
          </CardTitle>
          <CardDescription className="text-xs">
            Phân loại bài kiểm tra theo 3 khung điểm dựa trên câu trả lời đúng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Xuất sắc (80 - 100%)</span>
              <p className="text-xl font-bold text-foreground mt-1">{overview.scoreDistribution.excellent} bài</p>
            </div>
            <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Khá (50 - 79%)</span>
              <p className="text-xl font-bold text-foreground mt-1">{overview.scoreDistribution.good} bài</p>
            </div>
            <div className="p-3 rounded-lg border bg-destructive/5 border-destructive/20">
              <span className="text-xs font-semibold text-destructive">Cần ôn lại (&lt; 50%)</span>
              <p className="text-xl font-bold text-foreground mt-1">{overview.scoreDistribution.needsWork} bài</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Quiz Attempts & Sentences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-purple-500" />
              Lịch sử Bài kiểm tra Gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuizzesResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chưa có bài kiểm tra nào.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Học viên</th>
                      <th className="px-3 py-2.5">Điểm</th>
                      <th className="px-3 py-2.5">Đúng / Tổng</th>
                      <th className="px-3 py-2.5">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recentQuizzesResult.data.map((q: any) => (
                      <tr key={q.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-medium truncate max-w-[130px]">
                          {q.profiles?.display_name || q.profiles?.email || q.user_id}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-foreground">{q.score}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {q.correct_answers}/{q.total_questions}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {format(new Date(q.created_at), "dd/MM HH:mm", { locale: vi })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sentences */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-blue-500" />
              Lịch sử Đặt câu AI Gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSentencesResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chưa có bài tập đặt câu nào.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Từ vựng</th>
                      <th className="px-3 py-2.5">Câu người dùng viết</th>
                      <th className="px-3 py-2.5">Điểm</th>
                      <th className="px-3 py-2.5">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recentSentencesResult.data.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-bold text-foreground">
                          {s.vocabularies?.word || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground italic truncate max-w-[160px]">
                          "{s.user_sentence}"
                        </td>
                        <td className="px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                          {s.overall_score}/100
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {format(new Date(s.created_at), "dd/MM HH:mm", { locale: vi })}
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
    </div>
  );
}
