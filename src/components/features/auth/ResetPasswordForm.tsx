"use client";

<<<<<<< ours
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, CheckCircle2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";
import { resetPasswordAction } from "@/actions/auth/reset-password";
import { ROUTES } from "@/constants/routes";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pageError = useMemo(() => {
    const error = searchParams.get("error");

    if (error === "missing-code") {
      return "Liên kết khôi phục không đầy đủ. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.";
    }

    if (error === "expired-link") {
      return "Liên kết khôi phục đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu gửi lại email.";
    }

    if (error === "invalid-link") {
      return "Liên kết khôi phục không hợp lệ. Vui lòng kiểm tra lại email của bạn.";
    }

    return null;
  }, [searchParams]);
=======
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
>>>>>>> theirs

  const {
    register,
    handleSubmit,
    formState: { errors },
<<<<<<< ours
    reset,
=======
>>>>>>> theirs
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
<<<<<<< ours
    setSuccessMessage(null);

    try {
      const result = await resetPasswordAction(data);

      if (!result.success) {
        const message = result.error ?? "Không thể cập nhật mật khẩu.";
        toast.error(message);
        return;
      }

      const message = result.message ?? "Mật khẩu mới đã được cập nhật thành công.";
      setSuccessMessage(message);
      toast.success(message);
      reset();

      window.setTimeout(() => {
        router.replace(ROUTES.LOGIN);
      }, 1600);
    } catch {
      const message = "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
      toast.error(message);
=======
    try {
      const result = await resetPasswordAction(data);
      if (result && !result.success) {
        toast.error(result.error);
      } else {
        toast.success("Mật khẩu mới đã được cập nhật thành công.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
>>>>>>> theirs
    } finally {
      setIsLoading(false);
    }
  };

  return (
<<<<<<< ours
    <Card className="border-border/60 shadow-lg shadow-slate-950/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold tracking-tight">Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Tạo mật khẩu mới cho tài khoản của bạn để tiếp tục đăng nhập.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pageError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{pageError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" />
              Mật khẩu mới
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl border-border bg-card shadow-sm"
              disabled={isLoading}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-semibold text-rose-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" />
              Xác nhận mật khẩu mới
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl border-border bg-card shadow-sm"
              disabled={isLoading}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-semibold text-rose-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-xl font-semibold shadow-sm"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật mật khẩu
          </Button>
        </form>

        <div className="text-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
=======
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
>>>>>>> theirs
  );
}
