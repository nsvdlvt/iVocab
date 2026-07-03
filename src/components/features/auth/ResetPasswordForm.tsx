"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";
import { resetPasswordAction } from "@/actions/auth/reset-password";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const result = await resetPasswordAction(data);
      if (result && !result.success) {
        toast.error(result.error);
      } else {
        toast.success("Mật khẩu mới đã được cập nhật thành công.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Đặt lại mật khẩu</h2>
        <p className="text-sm text-muted-foreground">
          Nhập mật khẩu mới của bạn bên dưới để khôi phục quyền truy cập
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Mật khẩu mới
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            className="rounded-xl h-10 border-border bg-card shadow-sm"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Xác nhận mật khẩu mới
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            className="rounded-xl h-10 border-border bg-card shadow-sm"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-rose-500 font-semibold">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full rounded-xl h-10 mt-2 cursor-pointer shadow-sm font-semibold inline-flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cập nhật mật khẩu
        </Button>
      </form>
    </div>
  );
}
