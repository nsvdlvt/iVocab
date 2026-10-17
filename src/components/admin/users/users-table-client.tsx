"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, Shield, User, ExternalLink, MoreHorizontal, Flame, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changeUserRoleAction } from "@/actions/admin/users";
import { toast } from "sonner";
import { ProfileRow } from "@/repositories/admin/user.repository";

interface UsersTableClientProps {
  users: ProfileRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  search: string;
  roleFilter: string;
}

export function UsersTableClient({
  users,
  totalCount,
  currentPage,
  totalPages,
  search: initialSearch,
  roleFilter: initialRole,
}: UsersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [newRoleToApply, setNewRoleToApply] = useState<"user" | "admin" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyFilters = (newSearch: string, newRole: string, newPage: number = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    if (newRole && newRole !== "all") params.set("role", newRole);
    else params.delete("role");

    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser || !newRoleToApply) return;
    setIsSubmitting(true);
    try {
      const res = await changeUserRoleAction(selectedUser.id, newRoleToApply);
      if (res.ok) {
        toast.success(
          `Đã chuyển người dùng ${selectedUser.email} thành ${newRoleToApply === "admin" ? "Quản trị viên" : "Học viên"}`
        );
        setSelectedUser(null);
        newRoleToApply === null;
        router.refresh();
      } else {
        toast.error(res.error || "Không thể cập nhật quyền người dùng");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(searchTerm, initialRole, 1);
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={initialRole}
            onChange={(e) => applyFilters(searchTerm, e.target.value, 1)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả phân quyền</option>
            <option value="user">Học viên (User)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Phân quyền</th>
                <th className="px-4 py-3">Cấp độ</th>
                <th className="px-4 py-3">Chuỗi học (Streak)</th>
                <th className="px-4 py-3">Ngày tham gia</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy tài khoản người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {u.email[0]?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate max-w-[180px]">
                            {u.display_name || u.email.split("@")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className={
                          u.role === "admin"
                            ? "bg-[#030f31] text-white"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {u.role === "admin" ? (
                          <Shield className="h-3 w-3 mr-1 text-[#f9971d]" />
                        ) : null}
                        {u.role === "admin" ? "Admin" : "Học viên"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {u.level || "A1 - Mới bắt đầu"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span>{u.streak || 0} ngày</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(u.created_at), "dd/MM/yyyy", { locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted"
                          aria-label="Tùy chọn"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Tùy chọn tài khoản</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/admin/users/${u.id}`)}>
                            <div className="flex items-center gap-2 cursor-pointer w-full">
                              <ExternalLink className="h-4 w-4" />
                              <span>Xem chi tiết hồ sơ</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.role === "admin" ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRoleToApply("user");
                              }}
                              className="text-amber-600 focus:text-amber-600 cursor-pointer"
                            >
                              Hạ cấp xuống Học viên
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRoleToApply("admin");
                              }}
                              className="text-primary focus:text-primary cursor-pointer font-medium"
                            >
                              Thăng cấp lên Quản trị viên
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>
            Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> người dùng
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(initialSearch, initialRole, currentPage - 1)}
              className="h-8 text-xs"
            >
              Trang trước
            </Button>
            <span className="font-medium">
              Trang {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => applyFilters(initialSearch, initialRole, currentPage + 1)}
              className="h-8 text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={Boolean(selectedUser && newRoleToApply)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi phân quyền</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thay đổi phân quyền của tài khoản{" "}
              <strong>{selectedUser?.email}</strong> thành{" "}
              <strong className="text-foreground">
                {newRoleToApply === "admin" ? "Quản trị viên (Admin)" : "Học viên (User)"}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Quản trị viên có toàn quyền truy cập bảng điều khiển, chỉnh sửa dữ liệu người dùng và nội dung hệ thống.
            </span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button onClick={handleRoleChangeConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
