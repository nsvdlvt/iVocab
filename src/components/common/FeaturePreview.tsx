"use client";

import React from "react";
import { Sparkles, Clock3, Palette, BookOpenText, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeaturePreviewTone = "indigo" | "emerald" | "amber" | "rose" | "sky";

interface FeaturePreviewProps {
  title: string;
  description: string;
  eyebrow?: string;
  statusLabel?: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  badgeIcon?: LucideIcon;
  tone?: FeaturePreviewTone;
}

const toneStyles: Record<FeaturePreviewTone, { glow: string; accent: string; chip: string }> = {
  indigo: {
    glow: "from-indigo-500/30 via-sky-400/20 to-cyan-300/10",
    accent: "text-indigo-600",
    chip: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20",
  },
  emerald: {
    glow: "from-emerald-500/30 via-teal-400/20 to-cyan-300/10",
    accent: "text-emerald-600",
    chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  },
  amber: {
    glow: "from-amber-500/30 via-orange-400/20 to-rose-300/10",
    accent: "text-amber-600",
    chip: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  },
  rose: {
    glow: "from-rose-500/30 via-fuchsia-400/20 to-pink-300/10",
    accent: "text-rose-600",
    chip: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
  },
  sky: {
    glow: "from-sky-500/30 via-cyan-400/20 to-emerald-300/10",
    accent: "text-sky-600",
    chip: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
  },
};

const defaultHighlights = [
  {
    icon: BookOpenText,
    title: "Giao diện đang hoàn thiện",
    text: "Nội dung sẽ được mở dần khi tính năng sẵn sàng.",
  },
  {
    icon: Palette,
    title: "Thiết kế rõ ràng",
    text: "Bố cục gọn, màu sắc tươi và dễ đọc trên mọi màn hình.",
  },
  {
    icon: Clock3,
    title: "Không làm gián đoạn",
    text: "Bạn vẫn có thể quay lại các trang khác để học tiếp.",
  },
];

export function FeaturePreview({
  title,
  description,
  eyebrow = "Coming soon",
  statusLabel = "In progress",
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  badgeIcon: BadgeIcon = Sparkles,
  tone = "indigo",
}: FeaturePreviewProps) {
  const styles = toneStyles[tone];

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_52%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-6 lg:px-8">
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="absolute inset-x-10 top-6 h-32 rounded-full bg-gradient-to-r blur-3xl opacity-70 pointer-events-none" />
        <div className={`absolute inset-x-16 top-12 h-24 rounded-full bg-gradient-to-r ${styles.glow} blur-3xl opacity-80 pointer-events-none`} />

        <div className="relative w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ring-1 ${styles.chip}`}>
                <BadgeIcon className={`h-3.5 w-3.5 ${styles.accent}`} />
                {eyebrow}
              </div>

              <div className="mt-5 space-y-4">
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {defaultHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                      <div className={`mb-3 inline-flex rounded-2xl bg-white p-2 shadow-sm ${styles.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-950">{item.title}</h2>
                      <p className="mt-1 text-xs leading-6 text-slate-600">{item.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {primaryActionText && onPrimaryAction && (
                  <Button
                    onClick={onPrimaryAction}
                    className="rounded-2xl bg-slate-950 px-5 py-6 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
                  >
                    {primaryActionText}
                  </Button>
                )}
                {secondaryActionText && onSecondaryAction && (
                  <Button
                    variant="outline"
                    onClick={onSecondaryAction}
                    className="rounded-2xl border-slate-300 px-5 py-6 text-sm font-semibold text-slate-700"
                  >
                    {secondaryActionText}
                  </Button>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden border-t border-slate-200/70 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_24%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">{statusLabel}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Sắp mở cho bạn</h2>
                  </div>
                  <div className={`rounded-2xl bg-white/10 p-3 ${styles.accent}`}>
                    <BadgeIcon className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      Preview
                    </div>
                    <div className="text-lg font-semibold text-white">Giao diện tinh gọn, sáng và dễ nhìn</div>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Trang này đang được hoàn thiện để mở rộng cho nhiều khu vực khác nhau trong ứng dụng.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      Access
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">Responsive</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">Colorful</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">Reusable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
