import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ROUTES } from "@/constants/routes";
import { canAccessETeam, canAccessVocabeer } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Trang chủ | Vocabee",
  description: "Nền tảng học từ vựng tiếng Anh hiện đại với Flashcard, SRS và trợ lý AI thông minh.",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    const cookieStore = await cookies();
    const lastWorkspace = cookieStore.get("vocabee_last_workspace")?.value;

    if (lastWorkspace?.startsWith("/e-team") && canAccessETeam(user.role)) {
      redirect(ROUTES.ETEAM_DASHBOARD);
    }

    if ((lastWorkspace?.startsWith("/u") || lastWorkspace === "/dashboard") && canAccessVocabeer(user.role)) {
      redirect(ROUTES.VOCABEER_DASHBOARD);
    }

    // Default to workspace selection if multiple available or role-dependent
    if (canAccessVocabeer(user.role) && !canAccessETeam(user.role)) {
      redirect(ROUTES.VOCABEER_DASHBOARD);
    }

    redirect(ROUTES.SELECT_WORKSPACE);
  }

  return <LandingPage />;
}
