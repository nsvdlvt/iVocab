import type { Metadata } from "next";
import { AdminPromptRepository } from "@/repositories/admin/prompt.repository";
import { PromptsManagerClient } from "@/components/admin/prompts/prompts-manager-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Quản lý Prompts Hệ thống | Vocabee Admin",
  description: "Quản lý phiên bản câu lệnh AI (Prompts), hoàn tác phiên bản và thử nghiệm trực tiếp.",
};

export default async function AdminPromptsPage() {
  await requireAdmin();

  const { prompts, isDatabaseLive } = await AdminPromptRepository.getPrompts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý Prompts Hệ thống
          </h1>
          <p className="text-sm text-muted-foreground">
            Hệ thống quản lý phiên bản (Versioning) cho các câu lệnh AI production, thử nghiệm biến số và khôi phục an toàn.
          </p>
        </div>
      </div>

      <PromptsManagerClient prompts={prompts} isDatabaseLive={isDatabaseLive} />
    </div>
  );
}
