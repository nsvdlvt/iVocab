"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  TriangleAlert,
  Send,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "./OtpInput";
import { maskEmail } from "@/lib/validators/auth";
import { verifyOtpAction } from "@/actions/auth/verify-otp";
import { resendOtpAction } from "@/actions/auth/resend-otp";
import { ROUTES } from "@/constants/routes";

interface OtpVerificationFormProps {
  initialEmail?: string;
  initialType?: "signup" | "recovery" | "email" | "email_change";
  redirectTo?: string;
  onSuccess?: () => void;
  onBackToForm?: () => void;
}

export function OtpVerificationForm({
  initialEmail,
  initialType,
  redirectTo,
  onSuccess,
  onBackToForm,
}: OtpVerificationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const typeParam = (searchParams.get("type") as "signup" | "recovery" | "email" | "email_change") || "signup";
  const nextParam = searchParams.get("next") || redirectTo || ROUTES.SELECT_WORKSPACE;

  const [email, setEmail] = useState<string>(initialEmail || emailParam);
  const [type, setType] = useState<"signup" | "recovery" | "email" | "email_change">(initialType || typeParam);
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(60);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!initialEmail && !emailParam);
  const [tempEmail, setTempEmail] = useState<string>(initialEmail || emailParam);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const maskedDisplayEmail = useMemo(() => {
    return maskEmail(email);
  }, [email]);

  const title = useMemo(() => {
    if (type === "recovery") return "Khôi phục mật khẩu";
    if (type === "email_change") return "Xác nhận đổi email";
    return "Xác minh email";
  }, [type]);

  const description = useMemo(() => {
    if (type === "recovery") {
      return "Nhập mã gồm 6 chữ số được gửi đến email để xác nhận khôi phục mật khẩu:";
    }
    return "Nhập mã gồm 6 chữ số được gửi đến hộp thư để kích hoạt tài khoản của bạn:";
  }, [type]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMessage("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    if (otp.length !== 6) {
      setErrorMessage("Vui lòng nhập đầy đủ mã xác thực 6 chữ số.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await verifyOtpAction({
        email,
        token: otp,
        type,
        redirectTo: nextParam,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? "Mã xác thực không hợp lệ.");
        toast.error(result.error ?? "Mã xác thực không hợp lệ.");
        return;
      }

      setSuccessMessage("Xác thực thành công!");
      toast.success("Xác thực thành công!");

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // In Next.js, redirect() throws an internal error which triggers navigation
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const result = await resendOtpAction({
        email,
        type: type === "recovery" ? "recovery" : "signup",
      });

      if (result.success) {
        toast.success(result.message ?? "Đã gửi lại mã xác thực.");
        setCooldown(60);
        setOtp("");
      } else {
        setErrorMessage(result.error ?? "Không thể gửi lại mã.");
        toast.error(result.error ?? "Không thể gửi lại mã.");
      }
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail || !tempEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    setEmail(tempEmail.trim().toLowerCase());
    setIsEditingEmail(false);
    setErrorMessage(null);
    setCooldown(0); // Allow immediate resend to the new email
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm animate-in fade-in-50 duration-200">
      <CardHeader className="space-y-2 pb-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {description}
        </CardDescription>

        {!isEditingEmail && email ? (
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="rounded-xl border border-border/80 bg-muted/40 py-1.5 px-3 text-xs sm:text-sm font-semibold text-foreground font-mono">
              {maskedDisplayEmail}
            </span>
            <button
              type="button"
              onClick={() => {
                setTempEmail(email);
                setIsEditingEmail(true);
              }}
              title="Sửa địa chỉ email"
              aria-label="Sửa địa chỉ email"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMessage && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
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

        {isEditingEmail ? (
          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="otp-target-email" className="text-xs font-semibold text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground inline mr-1.5" />
                Địa chỉ Email nhận mã
              </Label>
              <Input
                id="otp-target-email"
                type="email"
                placeholder="name@example.com"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" size="sm" className="w-full rounded-xl font-semibold">
              Xác nhận email này
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-foreground block text-center">
                Mã xác thực OTP (6 chữ số)
              </Label>
              <OtpInput
                value={otp}
                length={6}
                onChange={(newOtp) => {
                  setOtp(newOtp);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                hasError={Boolean(errorMessage)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full rounded-xl font-semibold shadow-xs"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Xác nhận mã
            </Button>
          </form>
        )}

        {/* Resend OTP button */}
        {!isEditingEmail && email && (
          <div className="flex flex-col items-center justify-center gap-2 pt-1 border-t border-border/60">
            <p className="text-xs text-muted-foreground">Không nhận được mã xác thực?</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
              className="h-8 rounded-lg text-xs font-semibold"
            >
              {isResending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              {cooldown > 0 ? `Gửi lại mã sau (${cooldown}s)` : "Gửi lại mã mới"}
            </Button>
          </div>
        )}

        <div className="border-t border-border/60 pt-4 text-center">
          {onBackToForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={onBackToForm}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Quay lại màn hình đăng ký
            </Button>
          ) : (
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
