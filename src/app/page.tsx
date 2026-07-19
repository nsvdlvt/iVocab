import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; next?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  if (params?.code) {
    const next = params.next ?? ROUTES.DASHBOARD;
    const query = new URLSearchParams();
    query.set("code", params.code);
    query.set("next", next);
    redirect(`/auth/callback?${query.toString()}`);
  }

  const user = await getCurrentUser();

  if (user) {
    redirect(ROUTES.DASHBOARD);
  }

  return <LandingPage />;
}
