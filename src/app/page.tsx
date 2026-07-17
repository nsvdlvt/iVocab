import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(ROUTES.DASHBOARD);
  }

  return <LandingPage />;
}
