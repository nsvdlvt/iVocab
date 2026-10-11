"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { loginAction } from "@/actions/auth/login";
import { ROUTES } from "@/constants/routes";
import { SocialAuthSection } from "./SocialAuthSection";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

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
    try {
      const result = await loginAction(data);
      if (result && !result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập tài khoản</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu của bạn để tiếp tục hành trình học từ vựng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

          {/* Password */}
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
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="current-password"
              {...register("password")}
            />
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
          <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
