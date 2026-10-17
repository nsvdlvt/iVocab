"use client";

import { useState } from "react";
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
import { ChartDataPoint } from "@/repositories/admin/dashboard.repository";
import { Users, Library, TrendingUp } from "lucide-react";

interface DashboardChartsProps {
  userGrowth: ChartDataPoint[];
  vocabGrowth: ChartDataPoint[];
  studyActivity: ChartDataPoint[];
}

export function DashboardCharts({
  userGrowth,
  vocabGrowth,
  studyActivity,
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"users" | "vocab" | "study">("users");

  const activeData =
    activeTab === "users" ? userGrowth : activeTab === "vocab" ? vocabGrowth : studyActivity;

  const titleMap = {
    users: "Tăng trưởng Người dùng",
    vocab: "Tăng trưởng Bộ từ vựng",
    study: "Hoạt động Học tập (Phiên học)",
  };

  const descMap = {
    users: "Số lượng tài khoản mới đăng ký theo ngày (Dữ liệu thực tế)",
    vocab: "Số lượng bộ từ vựng được tạo theo ngày (Dữ liệu thực tế)",
    study: "Số phiên học tập được hoàn thành theo ngày (Dữ liệu thực tế)",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
      {/* Primary Trend Chart */}
      <Card className="col-span-4 shadow-sm border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#f9971d]" />
              {titleMap[activeTab]}
            </CardTitle>
            <CardDescription className="text-xs">{descMap[activeTab]}</CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "users"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Người dùng
            </button>
            <button
              onClick={() => setActiveTab("vocab")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "vocab"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Từ vựng
            </button>
            <button
              onClick={() => setActiveTab("study")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "study"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Học tập
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pl-2">
          <div className="h-[280px] w-full">
            {activeData.length === 0 || activeData.every((d) => d.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <p>Chưa có dữ liệu ghi nhận trong 30 ngày qua.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="date" stroke="currentColor" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Số lượng"
                    stroke="#f9971d"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#f9971d" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Bar Chart: Study Activity vs Vocabulary */}
      <Card className="col-span-3 shadow-sm border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Library className="h-4 w-4 text-blue-500" />
            Hoạt động Học tập Gần đây
          </CardTitle>
          <CardDescription className="text-xs">
            Số phiên học và ôn tập được ghi nhận (30 ngày)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pl-2">
          <div className="h-[280px] w-full">
            {studyActivity.length === 0 || studyActivity.every((d) => d.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <p>Chưa có phiên học tập nào được hoàn thành.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyActivity} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="date" stroke="currentColor" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" opacity={0.6} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="count" name="Phiên học" fill="#030f31" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
