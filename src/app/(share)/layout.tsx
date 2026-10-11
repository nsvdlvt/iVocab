import React from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={ROUTES.LANDING} className="flex items-center">
              <BrandLogo
                className="gap-2"
                imageClassName="h-8 w-8"
                textClassName="text-xl sm:text-2xl"
              />
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex gap-1">
              <Share2 className="h-3 w-3" />
              <span>Bộ từ chia sẻ</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={ROUTES.DASHBOARD}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Vào ứng dụng
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
