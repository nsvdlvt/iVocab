"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, Library, Bot, Settings, Megaphone } from "lucide-react";

export function AdminCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <p className="text-sm text-muted-foreground hidden md:flex items-center gap-1 border rounded-md px-2 py-1 bg-muted/50 w-full max-w-[300px] cursor-pointer" onClick={() => setOpen(true)}>
        <span className="flex-1">Search admin...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Users Management</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/vocabulary-sets"))}>
              <Library className="mr-2 h-4 w-4" />
              <span>Vocabulary Sets</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/ai"))}>
              <Bot className="mr-2 h-4 w-4" />
              <span>AI Center</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/announcements"))}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Announcements</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
