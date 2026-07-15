"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/layout/command-palette";

interface AdminTopbarProps {
  user: { email?: string; user_metadata?: { avatar_url?: string } } | null | undefined;
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  
  // Format pathname to display as a title, e.g., /admin/vocabulary-sets -> Vocabulary Sets
  const formatPathname = (path: string) => {
    if (path === "/admin") return "Dashboard";
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const title = formatPathname(pathname);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px] shrink-0">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial hidden md:block">
          <AdminCommandPalette />
        </div>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full cursor-pointer")}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "A"}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
