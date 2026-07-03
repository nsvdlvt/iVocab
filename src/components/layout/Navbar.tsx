"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/common/SearchBar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
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

          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-xl font-extrabold tracking-wider text-transparent select-none">
              IVOCAB
            </span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="hidden sm:flex flex-1 justify-center max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
