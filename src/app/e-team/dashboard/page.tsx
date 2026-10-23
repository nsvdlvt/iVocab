import type { Metadata } from "next";
import { requireETeamUser } from "@/lib/auth/require-user";
import { ETeamDashboardContent } from "@/components/e-team/dashboard/ETeamDashboardContent";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Trang tổng quan không gian làm việc E-Team Vocabee.",
};

export const dynamic = "force-dynamic";

export default async function ETeamDashboardPage() {
  const profile = await requireETeamUser();

  return <ETeamDashboardContent profile={profile} />;
}
