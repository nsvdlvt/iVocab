import type { Metadata } from "next";
import { Trophy, Flame, BrainCircuit, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminLeaderboardRepository } from "@/repositories/admin/leaderboard.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Bảng xếp hạng & Tương tác | Vocabee Admin",
  description: "Theo dõi bảng xếp hạng học viên, kỷ lục streak và phát hiện các chỉ số học tập bất thường.",
};

export default async function AdminLeaderboardPage() {
  await requireAdmin();

  const [streakLeaders, wordsLeaders, timeLeaders, anomalies] = await Promise.all([
    AdminLeaderboardRepository.getStreakLeaders(10),
    AdminLeaderboardRepository.getLearnedWordsLeaders(10),
    AdminLeaderboardRepository.getStudyTimeLeaders(10),
    AdminLeaderboardRepository.getAnomalies(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Bảng xếp hạng & Mức độ Tương tác
          </h1>
          <p className="text-sm text-muted-foreground">
            Bảng vàng thành tích học viên Vocabee dựa trên dữ liệu học tập thực tế và cảnh báo bất thường.
          </p>
        </div>
      </div>

      {/* Anomalies alert banner if any */}
      {anomalies.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              Cảnh báo Chỉ số Học tập Bất thường ({anomalies.length} trường hợp)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                <span className="font-semibold text-foreground">
                  {a.displayName} ({a.email}): <span className="font-normal text-muted-foreground">{a.issue}</span>
                </span>
                <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                  {a.metric}: {a.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3 Column Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Leaders */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#f9971d]" />
              Top Chuỗi học tập (Streak)
            </CardTitle>
            <CardDescription className="text-xs">Số ngày học liên tục không ngắt quãng</CardDescription>
          </CardHeader>
          <CardContent>
            {streakLeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Chưa có dữ liệu streak.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {streakLeaders.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 font-bold text-center ${u.rank === 1 ? "text-[#f9971d]" : u.rank === 2 ? "text-slate-400" : u.rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>
                        #{u.rank}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {u.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-foreground truncate">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">{u.level}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-bold text-[#f9971d] shrink-0">
                      <Flame className="h-4 w-4" />
                      <span>{u.score} ngày</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learned Words Leaders */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-emerald-500" />
              Top Từ vựng Đã thuộc
            </CardTitle>
            <CardDescription className="text-xs">Số từ đã thành thạo qua các vòng ôn tập</CardDescription>
          </CardHeader>
          <CardContent>
            {wordsLeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Chưa có dữ liệu từ thuộc.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {wordsLeaders.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 font-bold text-center ${u.rank === 1 ? "text-emerald-500" : "text-muted-foreground"}`}>
                        #{u.rank}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback className="text-[10px] bg-emerald-500/10 text-emerald-600">
                          {u.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-foreground truncate">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">{u.level}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold shrink-0">
                      {u.score} từ
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Time Leaders */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Top Thời gian Học tập
            </CardTitle>
            <CardDescription className="text-xs">Tổng thời lượng tích lũy trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {timeLeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Chưa có dữ liệu thời gian.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {timeLeaders.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 font-bold text-center ${u.rank === 1 ? "text-blue-500" : "text-muted-foreground"}`}>
                        #{u.rank}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">
                          {u.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-foreground truncate">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">{u.level}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{u.score} phút</span>
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
