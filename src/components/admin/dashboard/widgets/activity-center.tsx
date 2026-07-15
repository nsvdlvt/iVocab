import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";
import { AdminActivityRepository } from "@/repositories/admin/activity.repository";

export async function ActivityCenterWidget() {
  const activities = await AdminActivityRepository.getLatestActivities(10);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Activity Center
            </CardTitle>
            <CardDescription>Live feed of system events</CardDescription>
          </div>
          {/* Future: Add category filter dropdown here */}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Clock className="h-8 w-8 mb-4 opacity-50" />
            <p className="font-medium">No activity available yet.</p>
            <p className="text-sm opacity-70">The activity logging system is currently pending implementation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Future list of activities */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
