import type { Metadata } from "next";
import { AdminQualityRepository } from "@/repositories/admin/quality.repository";
import { QualityCenterClient } from "@/components/admin/quality/quality-center-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Đảm bảo Chất lượng Nội dung (QA) | Vocabee Admin",
  description: "Tự động kiểm tra chất lượng từ vựng, bộ thẻ và bài đọc để phát hiện thiếu sót ngữ nghĩa, phát âm và định dạng.",
};

export default async function AdminContentQualityPage() {
  await requireAdmin();

  const summary = await AdminQualityRepository.runQualityAudit();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Đảm bảo Chất lượng Nội dung (Content QA)
          </h1>
          <p className="text-sm text-muted-foreground">
            Hệ thống tự động phát hiện từ vựng thiếu nghĩa, IPA, ví dụ câu, trùng lặp hoặc bộ thẻ trống.
          </p>
        </div>
      </div>

      <QualityCenterClient summary={summary} />
    </div>
  );
}
