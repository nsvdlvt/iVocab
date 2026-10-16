"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  KeyRound,
  CheckCircle2,
  TriangleAlert,
  ChevronLeft,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";
import { resetPasswordAction } from "@/actions/auth/reset-password";
import { ROUTES } from "@/constants/routes";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pageError = useMemo(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (message) {
      return decodeURIComponent(message);
    }

    if (error === "missing-code") {
      return "Liên kết khôi phục không đầy đủ hoặc thiếu mã xác thực. Vui lòng yêu cầu gửi lại email.";
    }

    if (error === "expired-link") {
      return "Liên kết khôi phục đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.";
    }

    if (error === "invalid-link") {
      return "Liên kết khôi phục không hợp lệ. Vui lòng kiểm tra lại email của bạn.";
    }

    return null;
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
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
      }, 1800);
    } catch {
      const message = "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Thiết lập mật khẩu mới an toàn cho tài khoản Vocabee của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {pageError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-2">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{pageError}</p>
            </div>
            <div>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="inline-flex items-center gap-1 text-xs font-semibold underline hover:no-underline text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                Gửi lại yêu cầu đặt lại mật khẩu mới
              </Link>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage} Đang chuyển hướng về trang đăng nhập...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="reset-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 rounded-xl pr-10"
                disabled={isLoading}
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm new password */}
          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Xác nhận mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 rounded-xl pr-10"
                disabled={isLoading}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiển thị mật khẩu xác nhận"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-1 h-10 w-full rounded-xl font-semibold shadow-xs"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật mật khẩu
          </Button>
        </form>

        <div className="border-t border-border/60 pt-4 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
