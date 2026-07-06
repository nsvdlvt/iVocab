import { redirect } from "next/navigation";
import { getCurrentUser, type UserProfile } from "./get-current-user";
import { ROUTES } from "@/constants/routes";
import { perfEnd, perfStart } from "@/lib/perf";

export async function requireUser(): Promise<UserProfile> {
  const timer = perfStart("requireUser");
  try {
    const profile = await getCurrentUser();

    if (!profile) {
      redirect(ROUTES.LOGIN);
    }

    return profile;
  } finally {
    perfEnd(timer);
  }
}
