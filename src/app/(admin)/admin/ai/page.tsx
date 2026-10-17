import type { Metadata } from "next";
import { AdminAiRepository } from "@/repositories/admin/ai.repository";
import { AiCenterClient } from "@/components/admin/ai/ai-center-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Trung tâm AI & Đo lường | Vocabee Admin",
  description: "Theo dõi số lượng yêu cầu AI, tỷ lệ lỗi, độ trễ và kiểm tra mô hình Gemini trực tiếp.",
};

export default async function AdminAiPage() {
  await requireAdmin();

  const [telemetry, logsResult] = await Promise.all([
    AdminAiRepository.getTelemetry(),
    AdminAiRepository.getLogs(1, 20),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Trung tâm AI & Đo lường Mô hình
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản trị các kết nối Google Gemini API, tỷ lệ phản hồi, chi phí ước tính và kiểm tra thực thi live.
          </p>
        </div>
      </div>

      <AiCenterClient telemetry={telemetry} logs={logsResult.data} />
    </div>
  );
}
