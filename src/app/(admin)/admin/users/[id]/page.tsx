import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, User, Shield, BrainCircuit, Library, HelpCircle, Flame, Calendar, Clock } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { normalizeRole, ROLE_DISPLAY_NAMES } from "@/lib/auth/roles";
import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await AdminUserRepository.getUserById(id);
    if (data?.profile) {
      return {
        title: `Hồ sơ: ${data.profile.display_name || data.profile.email} | Vocabee Admin`,
      };
    }
  } catch {}
  return { title: "Chi tiết người dùng | Vocabee Admin" };
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const data = await AdminUserRepository.getUserById(id);
  if (!data) {
    notFound();
  }

  const { profile, statistics, vocabSets, recentQuizzes, recentStudySessions, totalWordsLearned } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-9 w-9")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {profile.display_name || profile.email.split("@")[0]}
              </h1>
              <Badge
                variant={normalizeRole(profile.role) === "admin" ? "default" : "secondary"}
                className={normalizeRole(profile.role) === "e_team" ? "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10" : ""}
              >
                {ROLE_DISPLAY_NAMES[normalizeRole(profile.role)]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{profile.email} • ID: {profile.id}</p>
          </div>
        </div>
      </div>

      {/* Profile & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Thông tin Tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium truncate max-w-[180px]">{profile.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tên hiển thị:</span>
              <span className="font-medium">{profile.display_name || "Chưa cập nhật"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Trình độ:</span>
              <span className="font-semibold text-foreground">{profile.level || "Basic (A1)"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Mục tiêu ngày:</span>
              <span className="font-medium">{profile.daily_goal || 20} từ / ngày</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Chuỗi học tập (Streak):</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#f9971d]">
                <Flame className="h-4 w-4" />
                <span>{profile.streak || 0} ngày (Kỷ lục: {profile.longest_streak || 0})</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Ngày đăng ký:</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Learning Statistics Card */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-emerald-500" />
              Tiến độ Học tập Thực tế
            </CardTitle>
            <CardDescription className="text-xs">Dữ liệu từ Spaced Repetition và các phiên học</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Từ đã thành thạo:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {totalWordsLearned} từ
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tổng số từ trong bộ:</span>
              <span className="font-medium">{statistics?.total_words || 0} từ</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Số lần ôn tập (Reviews):</span>
              <span className="font-medium">{statistics?.review_count || 0} lượt</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tổng thời gian học:</span>
              <span className="font-medium">
                {Math.round((statistics?.total_study_time || 0) / 60)} phút
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Bộ từ sở hữu:</span>
              <span className="font-medium">{vocabSets.length} bộ</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Card */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#f9971d]" />
              Bảo mật & Quyền hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                Đang hoạt động
              </Badge>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Phân quyền:</span>
              <span className="font-semibold text-foreground uppercase text-xs">{ROLE_DISPLAY_NAMES[normalizeRole(profile.role)]}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Hoạt động gần nhất:</span>
              <span className="text-xs text-muted-foreground">
                {profile.last_activity_at
                  ? format(new Date(profile.last_activity_at), "dd/MM/yyyy HH:mm", { locale: vi })
                  : "Chưa ghi nhận"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vocab Sets Owned */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Library className="h-4 w-4 text-blue-500" />
            Các Bộ từ vựng đã tạo ({vocabSets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vocabSets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Người dùng chưa tạo bộ từ vựng nào.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {vocabSets.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/admin/vocabulary-sets/${s.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {s.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{s.description || "Không có mô tả"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary">{s.word_count || 0} từ</Badge>
                    <Badge variant="outline">{s.visibility === "public" ? "Công khai" : "Riêng tư"}</Badge>
                    <span>{format(new Date(s.created_at), "dd/MM/yyyy", { locale: vi })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quizzes & Study Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-purple-500" />
              Lịch sử Làm bài kiểm tra gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Chưa có bài kiểm tra nào.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentQuizzes.map((q) => (
                  <div key={q.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">
                        Điểm: {q.score} ({q.correct_answers}/{q.total_questions} câu)
                      </span>
                      {q.duration && (
                        <p className="text-muted-foreground">Thời gian: {q.duration}s</p>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(q.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Study Sessions */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Phiên học gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStudySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Chưa có phiên học nào.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentStudySessions.map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">
                        Đã học: {s.studied_words || 0} từ • Nhớ: {s.remembered_words || 0} từ
                      </span>
                      <p className="text-muted-foreground">
                        Thời lượng: {Math.round((s.study_seconds || 0) / 60)} phút
                      </p>
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(s.started_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
