import { DashboardGrid } from "@/components/admin/dashboard/dashboard-grid";
import { DashboardChartsWidget } from "@/components/admin/dashboard/widgets/dashboard-charts-widget";
import { Plus, DatabaseZap, Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardGrid />

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>New Announcement</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <DatabaseZap className="h-5 w-5 text-primary" />
            <span>Clear Dict Cache</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <span>Send Notification</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-destructive/50 hover:bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span className="text-destructive">Clean Orphan Words</span>
          </Button>
        </div>
      </div>
      
      <DashboardChartsWidget />
    </div>
  );
}
