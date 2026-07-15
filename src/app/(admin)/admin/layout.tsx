import { requirePermission } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/layout/sidebar";
import { AdminTopbar } from "@/components/admin/layout/topbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Vocabee",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePermission("accessAdmin");

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col flex-1 sm:gap-4 sm:py-4">
        <div className="sm:px-6">
          <div className="rounded-xl border bg-background text-card-foreground shadow overflow-hidden flex flex-col h-[calc(100vh-2rem)]">
            <AdminTopbar user={user} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
