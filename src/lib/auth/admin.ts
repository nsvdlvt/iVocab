import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { redirect } from "next/navigation";

export type Role = "user" | "member" | "e_team" | "admin";
export type Action = 
  | "accessAdmin" 
  | "manageUsers" 
  | "manageVocabulary" 
  | "manageSettings" 
  | "manageSystem";

const rolePermissions: Record<Role, Action[]> = {
  user: [],
  member: [],
  e_team: [],
  admin: ["accessAdmin", "manageUsers", "manageVocabulary", "manageSettings", "manageSystem"],
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null as Role | null, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as Role) || "user";
  return { user, role, supabase };
}

export async function requireAdmin(returnUrl: string = "/admin") {
  const { user, role, supabase } = await getAdminSession();

  if (!user) {
    const safeNext = encodeURIComponent(returnUrl.startsWith("/") ? returnUrl : "/admin");
    redirect(`/login?next=${safeNext}`);
  }

  if (role !== "admin") {
    redirect("/403");
  }

  return { user, role, supabase };
}

export async function assertAdmin() {
  const { user, role, supabase } = await getAdminSession();

  if (!user) {
    throw new Error("UNAUTHENTICATED: Bạn cần đăng nhập để thực hiện thao tác này");
  }

  if (role !== "admin") {
    throw new Error("FORBIDDEN: Bạn không có quyền quản trị viên");
  }

  return { user, role, supabase };
}

export function hasRole(userRole: Role | null, expectedRole: Role | Role[]): boolean {
  if (!userRole) return false;
  if (Array.isArray(expectedRole)) {
    return expectedRole.includes(userRole);
  }
  return userRole === expectedRole;
}

export function can(userRole: Role | null, action: Action): boolean {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(action) ?? false;
}

export function cannot(userRole: Role | null, action: Action): boolean {
  return !can(userRole, action);
}

export async function requirePermission(action: Action, returnUrl: string = "/admin") {
  const { user, role, supabase } = await getAdminSession();

  if (!user) {
    const safeNext = encodeURIComponent(returnUrl.startsWith("/") ? returnUrl : "/admin");
    redirect(`/login?next=${safeNext}`);
  }

  if (!can(role, action)) {
    redirect("/403");
  }

  return { user, role, supabase };
}

export async function requireReadingAdmin(returnUrl: string = "/admin/reading") {
  const { user, role, supabase } = await getAdminSession();

  if (!user) {
    const safeNext = encodeURIComponent(returnUrl.startsWith("/") ? returnUrl : "/admin");
    redirect(`/login?next=${safeNext}`);
  }

  // Strictly require database admin role
  if (role !== "admin") {
    redirect("/403");
  }

  return { user, role, supabase };
}
