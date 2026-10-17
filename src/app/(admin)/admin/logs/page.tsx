import type { Metadata } from "next";
import { AdminHealthRepository } from "@/repositories/admin/health.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";
import { LogsClient } from "@/components/admin/logs/logs-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Nhật ký Hệ thống & Sức khỏe Dịch vụ | Vocabee Admin",
  description: "Theo dõi tình trạng kết nối dịch vụ, độ trễ và toàn bộ nhật ký kiểm toán hành động quản trị.",
};

export default async function AdminLogsPage() {
  await requireAdmin();

  const [healthChecks, logsResult] = await Promise.all([
    AdminHealthRepository.getSystemHealth(),
    AdminAuditRepository.getLogs(1, 50),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Nhật ký Quản trị & Sức khỏe Hệ thống (Audit & Logs)
          </h1>
          <p className="text-sm text-muted-foreground">
            Kiểm tra sức khỏe vận hành các vi dịch vụ và giám sát lịch sử thay đổi của quản trị viên.
          </p>
        </div>
      </div>

      <LogsClient
        healthChecks={healthChecks}
        logs={logsResult.data}
        totalLogs={logsResult.count}
        isDatabaseLive={logsResult.isDatabaseLive}
      />
    </div>
  );
}
