import { LineChartCard } from "@/components/admin/charts/line-chart-card";
import { BarChartCard } from "@/components/admin/charts/bar-chart-card";

const newUsersData = [
  { name: "Mon", users: 400 },
  { name: "Tue", users: 300 },
  { name: "Wed", users: 550 },
  { name: "Thu", users: 450 },
  { name: "Fri", users: 700 },
  { name: "Sat", users: 650 },
  { name: "Sun", users: 800 },
];

const aiRequestsData = [
  { name: "Mon", requests: 1200 },
  { name: "Tue", requests: 1300 },
  { name: "Wed", requests: 1800 },
  { name: "Thu", requests: 2000 },
  { name: "Fri", requests: 2400 },
  { name: "Sat", requests: 2100 },
  { name: "Sun", requests: 2800 },
];

export function DashboardChartsWidget() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <LineChartCard
        title="New Users (Last 7 Days)"
        description="Daily new user registrations."
        data={newUsersData}
        xAxisKey="name"
        lineDataKey="users"
        className="col-span-4"
      />
      
      <BarChartCard
        title="AI Requests"
        description="Total AI generations per day."
        data={aiRequestsData}
        xAxisKey="name"
        barDataKey="requests"
        className="col-span-3"
      />
    </div>
  );
}
