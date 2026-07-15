import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "403 - Forbidden",
};

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md w-full space-y-6 flex flex-col items-center">
        <div className="p-4 bg-destructive/10 rounded-full inline-flex items-center justify-center">
          <ShieldAlert className="w-16 h-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground text-lg">
            You don&apos;t have permission to access this page. If you believe this is an error, please contact support.
          </p>
        </div>

        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
