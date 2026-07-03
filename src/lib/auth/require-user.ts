import { redirect } from "next/navigation";
import { getCurrentUser, type UserProfile } from "./get-current-user";
import { ROUTES } from "@/constants/routes";

export async function requireUser(): Promise<UserProfile> {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  return profile;
}
