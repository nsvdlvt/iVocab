"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Mail, Eye, EyeOff, TriangleAlert, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { loginAction } from "@/actions/auth/login";
import { resendVerificationAction } from "@/actions/auth/resend-verification";
import { ROUTES } from "@/constants/routes";
import { mapAuthError } from "@/lib/auth/error-map";
import { SocialAuthSection } from "./SocialAuthSection";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const searchParams = useSearchParams();

  // Handle OAuth code or direct redirect
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const next = searchParams.get("next");
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("code", code);

    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    window.location.replace(callbackUrl.toString());
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Parse error / alert banner from query string
  const urlBannerError = useMemo(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (message) {
      return decodeURIComponent(message);
    }

    if (error) {
      return mapAuthError(error);
    }

    return null;
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setUnconfirmedEmail(null);

    try {
      const next = searchParams.get("next");
      const result = await loginAction({
        ...data,
        redirectTo: next || undefined,
      });

      if (result && !result.success) {
        if (result.unconfirmed && result.email) {
          setUnconfirmedEmail(result.email);
        }
        toast.error(result.error ?? "Đăng nhập thất bại.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail || resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res = await resendVerificationAction(unconfirmedEmail);
      if (res.success) {
        toast.success(res.message);
        setResendCooldown(60);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Không thể gửi lại email xác nhận. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  };

  const registerHref = useMemo(() => {
    const next = searchParams.get("next");
    if (next) {
      return `${ROUTES.REGISTER}?next=${encodeURIComponent(next)}`;
    }
    return ROUTES.REGISTER;
  }, [searchParams]);

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập tài khoản</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu của bạn để tiếp tục hành trình học từ vựng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {urlBannerError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{urlBannerError}</p>
            </div>
          </div>
        )}

        {unconfirmedEmail && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold">
              Tài khoản với email <span className="underline">{unconfirmedEmail}</span> chưa được kích hoạt.
            </p>
            <p>Vui lòng kiểm tra hộp thư đến (hoặc thư rác) hoặc bấm nút bên dưới để nhận liên kết mới:</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isResending || resendCooldown > 0}
                onClick={handleResendConfirmation}
                className="h-8 rounded-lg border-amber-500/30 bg-background text-amber-900 dark:text-amber-100 hover:bg-amber-500/10 text-xs font-semibold"
              >
                {isResending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                {resendCooldown > 0
                  ? `Gửi lại sau (${resendCooldown}s)`
                  : "Gửi lại email xác nhận"}
              </Button>
              <Link
                href={`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(unconfirmedEmail)}&type=signup`}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10 hover:underline transition-colors"
              >
                <span>Nhập mã OTP xác minh</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-xs font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Địa chỉ Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password with visibility toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Mật khẩu
              </Label>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 rounded-xl pr-10"
                disabled={isLoading}
                autoComplete="current-password"
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

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="mt-1 h-10 w-full rounded-xl font-semibold shadow-xs"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
          </Button>
        </form>

        <SocialAuthSection />

        <div className="border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href={registerHref} className="font-semibold text-primary hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
