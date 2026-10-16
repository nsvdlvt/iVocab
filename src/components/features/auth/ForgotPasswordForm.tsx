"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ChevronLeft, CheckCircle2, TriangleAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const result = await forgotPasswordAction(data);

      if (result.success) {
        const message =
          result.message ??
          "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong giây lát.";
        setSuccessMessage(message);
        setCooldown(60);
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
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Quên mật khẩu?</CardTitle>
        <CardDescription>
          Nhập địa chỉ email đã đăng ký để nhận liên kết khôi phục mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {formError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{formError}</p>
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
            <Label htmlFor="forgot-email" className="text-xs font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Địa chỉ Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="name@example.com"
              className="h-10 rounded-xl"
              disabled={isLoading || cooldown > 0}
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-1 h-10 w-full rounded-xl font-semibold shadow-xs"
            disabled={isLoading || cooldown > 0}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : "Gửi liên kết đặt lại"}
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
