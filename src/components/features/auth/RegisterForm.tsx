"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { registerAction } from "@/actions/auth/register";
import { ROUTES } from "@/constants/routes";
import { SocialAuthSection } from "./SocialAuthSection";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
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
        toast.success(result.message);
      } else {
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Mật khẩu
            </Label>
            <Input
              id="register-password"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password" className="text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              Xác nhận mật khẩu
            </Label>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="••••••••"
              className="h-10 rounded-xl"
              disabled={isLoading}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
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
          <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
