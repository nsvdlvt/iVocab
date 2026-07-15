"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>New Users (Last 7 Days)</CardTitle>
          <CardDescription>Daily new user registrations.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={newUsersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>AI Requests</CardTitle>
          <CardDescription>Total AI generations per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiRequestsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
