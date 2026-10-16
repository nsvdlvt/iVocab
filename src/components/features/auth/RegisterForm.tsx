"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Send,
  ArrowLeft,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { registerAction } from "@/actions/auth/register";
import { resendVerificationAction } from "@/actions/auth/resend-verification";
import { ROUTES } from "@/constants/routes";
import { SocialAuthSection } from "./SocialAuthSection";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dedicated email confirmation pending state
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const searchParams = useSearchParams();

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await registerAction(data);
      if (result.success) {
        if (result.emailConfirmationRequired && result.email) {
          setPendingConfirmationEmail(result.email);
          setResendCooldown(60);
          toast.success(result.message ?? "Đăng ký thành công! Vui lòng xác thực email.");
        } else {
          toast.success(result.message ?? "Đăng ký thành công!");
        }
      } else {
        toast.error(result.error ?? "Đăng ký không thành công.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingConfirmationEmail || resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res = await resendVerificationAction(pendingConfirmationEmail);
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

  const loginHref = React.useMemo(() => {
    const next = searchParams.get("next");
    if (next) {
      return `${ROUTES.LOGIN}?next=${encodeURIComponent(next)}`;
    }
    return ROUTES.LOGIN;
  }, [searchParams]);

  // Dedicated email confirmation pending view
  if (pendingConfirmationEmail) {
    return (
      <Card className="rounded-2xl border-border/80 bg-card shadow-sm animate-in fade-in-50 duration-200">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Xác thực tài khoản</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Chúng tôi đã gửi liên kết kích hoạt tài khoản đến địa chỉ:
          </CardDescription>
          <div className="rounded-xl border border-border/80 bg-muted/40 py-2 px-3 text-sm font-semibold text-foreground">
            {pendingConfirmationEmail}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/Spam) của bạn và bấm vào liên kết xác nhận để bắt đầu học tập.
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 w-full rounded-xl font-semibold shadow-2xs"
              disabled={isResending || resendCooldown > 0}
              onClick={handleResend}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {resendCooldown > 0
                ? `Gửi lại email sau (${resendCooldown}s)`
                : "Gửi lại email kích hoạt"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPendingConfirmationEmail(null)}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Thay đổi địa chỉ email
            </Button>
          </div>

          <div className="border-t border-border/60 pt-4 text-center">
            <Link
              href={loginHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Đăng ký tài khoản</CardTitle>
        <CardDescription>
          Tạo tài khoản miễn phí để bắt đầu xây dựng vốn từ vựng và theo dõi tiến độ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="register-name" className="text-xs font-semibold text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Họ và tên
            </Label>
            <Input
              id="register-name"
              type="text"
              placeholder="Nguyễn Văn A"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-xs font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Địa chỉ Email
            </Label>
            <Input
              id="register-email"
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
            <Label htmlFor="register-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="register-password"
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

          {/* Confirm Password with visibility toggle */}
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Xác nhận mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="register-confirm-password"
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
              <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
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
            Đăng ký tài khoản
          </Button>
        </form>

        <SocialAuthSection />

        <div className="border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href={loginHref} className="font-semibold text-primary hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
