import type { Metadata } from "next";
import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { AdminDataTable } from "@/components/admin/tables/data-table";
import { columns } from "./columns";
import { requirePermission } from "@/lib/auth/admin";
import { Button } from "@/components/ui/button";
import { UserRow } from "./columns";

export const metadata: Metadata = {
  title: "Quản lý người dùng",
  description: "Quản lý danh sách tài khoản và phân quyền người dùng Vocabee.",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("manageUsers");

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = params?.search as string || "";

  const { data: users } = await AdminUserRepository.getUsers(page, 10, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground">Manage user accounts and roles.</p>
      </div>
      
      <AdminDataTable
        columns={columns}
        data={users as unknown as UserRow[]}
        searchKey="email"
        bulkActions={
          <Button variant="destructive" size="sm" className="h-8">
            Suspend Selected
          </Button>
        }
      />
    </div>
  );
}
