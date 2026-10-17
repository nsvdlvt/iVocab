import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, UserPlus, BookOpen, Library, Shield } from "lucide-react";
import { AdminActivityRepository } from "@/repositories/admin/activity.repository";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export async function ActivityCenterWidget() {
  const activities = await AdminActivityRepository.getLatestActivities(7);

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case "vocab_set":
        return <Library className="h-4 w-4 text-blue-500" />;
      case "reading":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <Shield className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-sm border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#f9971d]" />
              Nhật ký Hoạt động Thời gian thực
            </CardTitle>
            <CardDescription className="text-xs">
              Các sự kiện đăng ký, tạo từ vựng và thao tác quản trị gần đây
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Clock className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">Chưa ghi nhận hoạt động gần đây</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {activities.map((act) => {
              let timeLabel = act.created_at;
              try {
                timeLabel = formatDistanceToNow(new Date(act.created_at), {
                  addSuffix: true,
                  locale: vi,
                });
              } catch {}

              return (
                <div key={act.id} className="py-2.5 flex items-start gap-3 text-sm">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-muted shrink-0">
                    {getIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {act.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {timeLabel}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {act.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex">
                    {act.category}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
