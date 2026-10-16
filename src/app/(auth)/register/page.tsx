import React from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Vocabee để bắt đầu hành trình ghi nhớ từ vựng tiếng Anh bền vững.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
