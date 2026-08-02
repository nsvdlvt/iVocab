"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ChevronLeft, CheckCircle2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const result = await forgotPasswordAction(data);

      if (result.success) {
        const message = result.message ?? "Đã gửi liên kết đặt lại mật khẩu.";
        setSuccessMessage(message);
        toast.success(message);
        return;
      }

      const message = result.error ?? "Không thể gửi liên kết đặt lại mật khẩu.";
      setFormError(message);
      toast.error(message);
    } catch {
      const message = "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg shadow-slate-950/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold tracking-tight">Quên mật khẩu?</CardTitle>
        <CardDescription>
          Nhập địa chỉ email của bạn để nhận liên kết khôi phục mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{formError}</p>
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
              <Mail className="h-3.5 w-3.5" />
              Địa chỉ email
            </label>
            <Input
              type="email"
              placeholder="name@example.com"
              className="h-10 rounded-xl border-border bg-card shadow-sm"
              disabled={isLoading}
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-semibold text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-xl font-semibold shadow-sm"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi liên kết đặt lại
          </Button>
        </form>

        <div className="text-center">
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
