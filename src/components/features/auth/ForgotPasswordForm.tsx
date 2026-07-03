"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const result = await forgotPasswordAction(data);
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
        <h2 className="text-2xl font-bold tracking-tight">Quên mật khẩu?</h2>
        <p className="text-sm text-muted-foreground">
          Nhập địa chỉ email của bạn để nhận liên kết khôi phục mật khẩu tài khoản
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full rounded-xl h-10 mt-2 cursor-pointer shadow-sm font-semibold inline-flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gửi yêu cầu khôi phục
        </Button>
      </form>

      <div className="text-center">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
