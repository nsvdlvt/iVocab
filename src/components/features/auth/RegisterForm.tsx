"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Đăng ký tài khoản</h2>
        <p className="text-sm text-muted-foreground">
          Đăng ký tài khoản mới để bắt đầu học tập và theo dõi tiến độ
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Họ và tên
          </label>
          <Input
            type="text"
            placeholder="Nguyễn Văn A"
            className="rounded-xl h-10 border-border bg-card shadow-sm"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Địa chỉ Email
          </label>
          <Input
            type="email"
            placeholder="name@example.com"
            className="rounded-xl h-10 border-border bg-card shadow-sm"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Mật khẩu
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
            Xác nhận mật khẩu
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
          Đăng ký
        </Button>
      </form>

      <SocialAuthSection />

      <div className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
