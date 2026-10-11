"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, CheckCircle2, TriangleAlert, ChevronLeft } from "lucide-react";
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
      }, 1600);
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
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{pageError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Mật khẩu mới
            </Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Xác nhận mật khẩu mới
            </Label>
            <Input
              id="reset-confirm-password"
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
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
