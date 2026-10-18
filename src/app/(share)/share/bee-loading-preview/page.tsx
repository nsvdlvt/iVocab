"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import {
  BeeLoading,
  BeeVectorAnimated,
  BeeProgressBar,
  LOADING_CONTEXTS,
  type LoadingContextKey,
} from "@/components/common/BeeLoading";
import { Sparkles, Sliders, Play, RotateCcw, Eye, ShieldCheck, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function BeeLoadingPreviewPage() {
  const [selectedContext, setSelectedContext] = useState<LoadingContextKey>("workspace");
  const [mascotType, setMascotType] = useState<"vector" | "image">("vector");
  const [simulatedProgress, setSimulatedProgress] = useState<number | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev === undefined || prev >= 100) {
          setIsSimulating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Vocabee Bee Loading 2.0"
          description="Hệ thống trải nghiệm loading sinh động, cao cấp, thân thiện và đồng nhất với thương hiệu Vocabee."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl gap-1.5"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Đổi giao diện</span>
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <SectionCard className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-foreground">Bảng điều khiển thử nghiệm</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mascotType === "vector" ? "default" : "outline"}
              size="sm"
              onClick={() => setMascotType("vector")}
              className="rounded-xl text-xs"
            >
              Mascot SVG Vector
            </Button>
            <Button
              variant={mascotType === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setMascotType("image")}
              className="rounded-xl text-xs"
            >
              Mascot 3D Asset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullscreen(!showFullscreen)}
              className="rounded-xl text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              {showFullscreen ? "Đóng toàn màn hình" : "Thử toàn màn hình"}
            </Button>
          </div>
        </div>

        {/* Context Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chọn ngữ cảnh tải dữ liệu:
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LOADING_CONTEXTS) as LoadingContextKey[]).map((key) => (
              <Button
                key={key}
                variant={selectedContext === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedContext(key)}
                className="rounded-xl text-xs capitalize"
              >
                {key}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress Bar Controller */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="text-xs font-semibold text-muted-foreground">Tiến trình (Progress):</span>
          <Button
            variant={simulatedProgress === undefined ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsSimulating(false);
              setSimulatedProgress(undefined);
            }}
            className="rounded-xl text-xs"
          >
            Chạy liên tục (Indeterminate)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSimulatedProgress(0);
              setIsSimulating(true);
            }}
            disabled={isSimulating}
            className="rounded-xl text-xs gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            {isSimulating ? `Đang chạy (${simulatedProgress}%)` : "Mô phỏng 0-100%"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSimulating(false);
              setSimulatedProgress(undefined);
            }}
            className="rounded-xl text-xs gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </SectionCard>

      {/* Fullscreen Overlay Mode */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullscreen(false)}
              className="rounded-xl shadow-md"
            >
              Đóng xem toàn màn hình
            </Button>
          </div>
          <BeeLoading
            variant="fullscreen"
            context={selectedContext}
            mascotType={mascotType}
            progress={simulatedProgress}
          />
        </div>
      )}

      {/* Live Preview Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compact Card Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Biến thể Compact (Thẻ độc lập)
          </h4>
          <div className="rounded-3xl border border-border/80 bg-muted/20 p-6 flex items-center justify-center min-h-[380px]">
            <BeeLoading
              variant="compact"
              context={selectedContext}
              mascotType={mascotType}
              progress={simulatedProgress}
            />
          </div>
        </div>

        {/* Mascot Details & Micro-Interactions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Chi tiết hoạt ảnh Mascot & Progress Bar
          </h4>
          <SectionCard className="p-6 space-y-6 flex flex-col items-center justify-center text-center min-h-[380px]">
            <div className="flex items-center justify-center gap-8 py-2">
              <div className="text-center space-y-2">
                <BeeVectorAnimated size={100} />
                <p className="text-xs text-muted-foreground font-medium">SVG Cánh vỗ & chớp mắt</p>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground text-left">
                  Thanh tiến trình không xác định (Indeterminate):
                </p>
                <BeeProgressBar />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground text-left">
                  Thanh tiến trình thực tế (75%):
                </p>
                <BeeProgressBar progress={75} />
              </div>
            </div>

            <div className="pt-2 w-full">
              <p className="text-xs font-semibold text-muted-foreground mb-2 text-left">
                Biến thể Inline (Nhỏ gọn):
              </p>
              <div className="flex justify-center">
                <BeeLoading
                  variant="inline"
                  context={selectedContext}
                  mascotType={mascotType}
                  progress={simulatedProgress}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
