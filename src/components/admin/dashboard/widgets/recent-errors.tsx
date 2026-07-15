import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { AdminDashboardRepository } from "@/repositories/admin/dashboard.repository";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function RecentErrorsData() {
  let errors: Array<{id: number; type: string; message: string; time: string}> = [];
  let isError = false;
  try {
    errors = await AdminDashboardRepository.getRecentErrors();
  } catch (_err) {
    isError = true;
  }
  
  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm font-medium">Failed to load recent errors</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.map((error) => (
        <div key={error.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium leading-none">{error.message}</p>
            <p className="text-xs text-muted-foreground">{error.type} • {error.time}</p>
          </div>
        </div>
      ))}
      {errors.length === 0 && (
        <p className="text-sm text-muted-foreground">No recent errors detected.</p>
      )}
    </div>
  );
}

export function RecentErrorsWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Errors</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }>
          <RecentErrorsData />
        </Suspense>
      </CardContent>
    </Card>
  );
}
