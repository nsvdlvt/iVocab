import type { Metadata } from "next";
import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { UsersTableClient } from "@/components/admin/users/users-table-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Quản lý Người dùng | Vocabee Admin",
  description: "Quản lý danh sách tài khoản, hồ sơ và phân quyền người dùng Vocabee.",
};

interface AdminUsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = (params?.search as string) || "";
  const role = (params?.role as "all" | "user" | "admin") || "all";

  const { data: users, count, totalPages } = await AdminUserRepository.getUsers(
    page,
    15,
    search,
    role
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý Người dùng
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả tài khoản học viên và quản trị viên trong cơ sở dữ liệu.
          </p>
        </div>
      </div>

      <UsersTableClient
        users={users}
        totalCount={count}
        currentPage={page}
        pageSize={15}
        totalPages={totalPages}
        search={search}
        roleFilter={role}
      />
    </div>
  );
}
