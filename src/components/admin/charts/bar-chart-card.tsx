"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export interface BarChartCardProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xAxisKey: string;
  barDataKey: string;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function BarChartCard({
  title,
  description,
  data,
  xAxisKey,
  barDataKey,
  className,
  isLoading,
  isError,
}: BarChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
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
              <BarChart data={data}>
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
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey={barDataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
