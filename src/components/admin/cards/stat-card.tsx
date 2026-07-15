import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  title: string;
  icon: LucideIcon;
  value?: string | number;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
}

export function StatCard({
  title,
  icon: Icon,
  value,
  description,
  isLoading,
  isError,
  isEmpty,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 mt-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-destructive mt-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Failed to load</span>
          </div>
        ) : isEmpty ? (
          <div className="text-2xl font-bold mt-1 text-muted-foreground">-</div>
        ) : (
          <>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
