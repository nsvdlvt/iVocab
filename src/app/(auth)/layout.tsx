import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Clock3, Flame, Sparkles, BookOpenCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
}

const capabilityHighlights = [
  {
    icon: Clock3,
    title: "Lặp lại ngắt quãng SRS",
    description: "Tự động lên lịch ôn tập vào thời điểm vàng giúp nhớ từ lâu gấp 3 lần.",
  },
  {
    icon: Brain,
    title: "Thực hành ngữ cảnh cùng AI",
    description: "Luyện trắc nghiệm thích ứng, bài điền từ Cloze và giải thích ngữ nghĩa chuyên sâu.",
  },
  {
    icon: BookOpenCheck,
    title: "Đọc song ngữ & Chạm tra từ",
    description: "Đọc bài viết phân cấp CEFR, chạm tra nghĩa tức thì và lưu vào bộ thẻ cá nhân.",
  },
  {
    icon: Flame,
    title: "Theo dõi Streak & Tiến độ",
    description: "Xây dựng kỷ luật học tập mỗi ngày với thống kê trực quan và mục tiêu rõ ràng.",
  },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-background text-foreground">
      {/* Left Column: Architectural Brand Showcase (Desktop) */}
      <div className="dark hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-slate-950 text-slate-50 relative overflow-hidden border-r border-slate-800/80">
        {/* Ambient architectural grid & radial glows */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href={ROUTES.LANDING} className="w-fit select-none focus-visible:outline-none">
            <BrandLogo
              className="gap-3"
              imageClassName="h-10 w-10"
              textClassName="scale-100 [&_span:first-child]:text-white"
            />
          </Link>
          <Badge variant="outline" className="border-slate-700/80 bg-slate-900/80 text-slate-200 px-3 py-1 text-xs">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
            Spaced Repetition & AI
          </Badge>
        </div>

        {/* Center Capability Showcase */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-3.5">
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-[1.15] text-white">
              Hệ thống hóa vốn từ vựng tiếng Anh và ghi nhớ bền vững mỗi ngày.
            </h1>
            <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
              Kết hợp thẻ nhớ Flashcard 3D, thuật toán lặp lại ngắt quãng (SRS) và trợ lý thực hành AI trong một không gian học tập tối giản, tốc độ cao.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {capabilityHighlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-xs transition-colors hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="mt-3 text-sm font-bold text-white">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer Metrics */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <span>© 2026 Vocabee. Nền tảng học từ vựng thông minh.</span>
          <span className="font-medium text-slate-300">94.8% tỷ lệ duy trì trí nhớ</span>
        </div>
      </div>

      {/* Right Column: Centered Auth Container */}
      <div className="flex flex-col justify-between p-4 sm:p-6 md:p-10">
        {/* Top Utility Bar (Mobile Brand + Back to Home + ThemeToggle) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.LANDING}
              className="inline-flex items-center lg:hidden"
              aria-label="Trang chủ Vocabee"
            >
              <BrandLogo
                imageClassName="h-8 w-8"
                textClassName="scale-[0.85] origin-left"
              />
            </Link>
            <Link
              href={ROUTES.LANDING}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Trang chủ
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* Centered Form Card Wrapper */}
        <div className="my-auto mx-auto w-full max-w-md py-6">
          {children}
        </div>

        {/* Subtle Bottom Note */}
        <div className="text-center text-xs text-muted-foreground">
          Bảo mật xác thực & đồng bộ đám mây thời gian thực
        </div>
      </div>
    </div>
  );
}
