import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { WorkspaceSelector } from "@/components/workspace/WorkspaceSelector";

export const metadata: Metadata = {
  title: "Chọn không gian | Vocabee",
  description: "Chọn không gian làm việc Vocabeer hoặc E-Team trên hệ thống Vocabee.",
};

export const dynamic = "force-dynamic";

export default async function SelectWorkspacePage() {
  const profile = await requireUser();

  return <WorkspaceSelector profile={profile} />;
}
