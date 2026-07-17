"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useSidebar } from "@/hooks/use-sidebar";
import { ROUTES } from "@/constants/routes";

export function Navbar() {
  const { toggleMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl hover:bg-accent/50 cursor-pointer"
            onClick={toggleMobileOpen}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Mở menu</span>
          </Button>

          <Link href={ROUTES.DASHBOARD} className="flex items-center">
            <BrandLogo className="gap-2" imageClassName="h-9 w-9 sm:h-10 sm:w-10" textClassName="scale-[0.9] origin-left" />
          </Link>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
