"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export interface LineChartCardProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xAxisKey: string;
  lineDataKey: string;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function LineChartCard({
  title,
  description,
  data,
  xAxisKey,
  lineDataKey,
  className,
  isLoading,
  isError,
}: LineChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : isError ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Failed to load chart data.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                <XAxis
                  dataKey={xAxisKey}
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
                  dataKey={lineDataKey}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
