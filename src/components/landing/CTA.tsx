"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function CTA() {
  return (
    <section className="bg-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-8 text-center shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Sẵn sàng bắt đầu?</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Bắt đầu bằng một trải nghiệm học từ vựng chỉn chu, rồi để sản phẩm giữ người dùng quay lại.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Từ cái nhìn đầu tiên đến thẻ ôn cuối cùng, landing page giờ kể đúng một câu chuyện với ứng dụng.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" className="h-13 rounded-full bg-blue-600 px-7 text-base font-black text-white hover:bg-blue-500">
                Tạo tài khoản
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button size="lg" variant="outline" className="h-13 rounded-full border-slate-300 bg-white px-7 text-base font-bold text-slate-800 hover:bg-slate-50">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

