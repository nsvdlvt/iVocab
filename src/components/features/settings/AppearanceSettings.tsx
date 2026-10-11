"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/50 border border-border" />
        ))}
      </div>
    );
  }

  const themes = [
    {
      id: "light",
      name: "Chủ đề Sáng",
      subtitle: "Giao diện nền sáng rực rỡ, tối ưu cho học ban ngày",
      icon: Sun,
      iconColor: "text-amber-500",
      previewBg: "bg-slate-50 border-slate-200 text-slate-800",
    },
    {
      id: "dark",
      name: "Chủ đề Tối",
      subtitle: "Giao diện nền tối êm dịu, bảo vệ mắt khi học ban đêm",
      icon: Moon,
      iconColor: "text-violet-400",
      previewBg: "bg-zinc-950 border-zinc-800 text-zinc-200",
    },
    {
      id: "system",
      name: "Theo Hệ thống",
      subtitle: "Tự động đồng bộ theo cài đặt thiết bị của bạn",
      icon: Laptop,
      iconColor: "text-primary",
      previewBg: "bg-gradient-to-r from-slate-100 to-zinc-900 border-border text-foreground",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
        {themes.map((item) => {
          const Icon = item.icon;
          const isSelected = theme === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                isSelected
                  ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/30"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs animate-in zoom-in-75 duration-150">
                  <Check className="h-3 w-3" />
                </div>
              )}

              <div
                className={cn(
                  "flex h-20 w-full items-center justify-center rounded-xl border text-xs font-bold shadow-2xs transition-transform duration-200 group-hover:scale-[1.02]",
                  item.previewBg
                )}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-xs border border-border/40 text-foreground">
                  <Icon className={cn("h-4 w-4", item.iconColor)} />
                  <span className="text-[11px] font-semibold">{item.name}</span>
                </div>
              </div>

              <div className="mt-3 w-full text-center space-y-0.5">
                <div className="text-xs font-bold text-foreground">{item.name}</div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground pt-1">
        Lựa chọn giao diện sẽ được lưu trữ tự động trên thiết bị của bạn và giữ nguyên khi tải lại trang.
      </p>
    </div>
  );
}
