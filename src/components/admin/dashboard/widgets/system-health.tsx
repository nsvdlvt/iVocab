import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { AdminHealthRepository, HealthStatus, SystemHealthResult } from "@/repositories/admin/health.repository";
import { Badge } from "@/components/ui/badge";

const StatusIcon = ({ status }: { status: HealthStatus }) => {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "unhealthy":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "unknown":
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export async function SystemHealthWidget() {
  const healthChecks = await AdminHealthRepository.getSystemHealth();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-muted-foreground" />
          System Health
        </CardTitle>
        <CardDescription>Live infrastructure status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 flex flex-col">
          {healthChecks.map((check: SystemHealthResult) => (
            <div key={check.service} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <StatusIcon status={check.status} />
                <span className="font-medium">{check.service}</span>
              </div>
              <div className="flex items-center gap-2">
                {check.status === "unknown" ? (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                ) : (
                  <>
                    <Badge variant="outline" className={
                      check.status === "healthy" ? "text-green-500 border-green-500/30" : 
                      check.status === "degraded" ? "text-yellow-500 border-yellow-500/30" : 
                      "text-red-500 border-red-500/30"
                    }>
                      {check.status === "healthy" ? "Healthy" : check.status === "degraded" ? "Degraded" : "Unhealthy"}
                    </Badge>
                    {check.latencyMs !== undefined && (
                      <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                        {check.latencyMs}ms
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
