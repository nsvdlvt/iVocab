"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { loginAction } from "@/actions/auth/login";
import { ROUTES } from "@/constants/routes";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Đăng nhập tài khoản</h2>
        <p className="text-sm text-muted-foreground">
          Nhập email và mật khẩu của bạn để truy cập hệ thống học tập
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Mật khẩu
            </label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full rounded-xl h-10 mt-2 cursor-pointer shadow-sm font-semibold inline-flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}
