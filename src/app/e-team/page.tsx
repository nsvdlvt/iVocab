import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ETeamRootPage() {
  redirect(ROUTES.ETEAM_DASHBOARD);
}
