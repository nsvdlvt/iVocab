import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/layout/sidebar";
import { AdminTopbar } from "@/components/admin/layout/topbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Quản trị hệ thống",
    template: "%s | Vocabee Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
