"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface LearnSettings {
  directionEnVi: boolean;
  directionViEn: boolean;
  typeMcq: boolean;
  typeInput: boolean;
  onlyLearning: boolean;
  orderRandom: boolean;
  autoContinue: boolean;
}

interface LearnSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LearnSettings;
  onSaveSettings: (settings: LearnSettings) => void;
}

export function LearnSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
}: LearnSettingsDialogProps) {
  const [localSettings, setLocalSettings] = React.useState<LearnSettings>({ ...settings });

  // Sync settings when dialogue opens
  React.useEffect(() => {
    if (open) {
      const handle = setTimeout(() => {
        setLocalSettings({ ...settings });
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [open, settings]);

  const updateSetting = <K extends keyof LearnSettings>(key: K, value: LearnSettings[K]) => {
    setLocalSettings((prev) => {
      const next = { ...prev, [key]: value };
      
      // Validation checks
      if (!next.directionEnVi && !next.directionViEn) {
        if (key === "directionEnVi") next.directionViEn = true;
        else next.directionEnVi = true;
      }
      if (!next.typeMcq && !next.typeInput) {
        if (key === "typeMcq") next.typeInput = true;
        else next.typeMcq = true;
      }
      
      return next;
    });
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg p-5 border shadow-xl bg-card select-none">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-extrabold text-foreground">Cấu hình chế độ học</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tùy chỉnh hướng câu hỏi, dạng bài tập và hành vi kiểm tra của phiên học.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-5">
          {/* Section 1 - Answer Direction */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Hướng câu hỏi</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="dir-en-vi"
                  checked={localSettings.directionEnVi}
                  onCheckedChange={(val: boolean) => updateSetting("directionEnVi", val)}
                  className="rounded-md"
                />
                <Label htmlFor="dir-en-vi" className="text-xs font-semibold cursor-pointer">Anh → Việt</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="dir-vi-en"
                  checked={localSettings.directionViEn}
                  onCheckedChange={(val: boolean) => updateSetting("directionViEn", val)}
                  className="rounded-md"
                />
                <Label htmlFor="dir-vi-en" className="text-xs font-semibold cursor-pointer">Việt → Anh</Label>
              </div>
            </div>
          </div>

          {/* Section 2 - Question Types */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Dạng bài tập</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="type-mcq"
                  checked={localSettings.typeMcq}
                  onCheckedChange={(val: boolean) => updateSetting("typeMcq", val)}
                  className="rounded-md"
                />
                <Label htmlFor="type-mcq" className="text-xs font-semibold cursor-pointer">Trắc nghiệm</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="type-input"
                  checked={localSettings.typeInput}
                  onCheckedChange={(val: boolean) => updateSetting("typeInput", val)}
                  className="rounded-md"
                />
                <Label htmlFor="type-input" className="text-xs font-semibold cursor-pointer">Tự điền từ</Label>
              </div>
            </div>
          </div>

          {/* Section 3 - Study Order */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Thứ tự câu hỏi</h4>
            <RadioGroup
              value={localSettings.orderRandom ? "random" : "original"}
              onValueChange={(val: unknown) => updateSetting("orderRandom", (val as string) === "random")}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <RadioGroupItem id="order-random" value="random" className="text-indigo-600" />
                <Label htmlFor="order-random" className="text-xs font-semibold cursor-pointer">Trộn ngẫu nhiên</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <RadioGroupItem id="order-original" value="original" className="text-indigo-600" />
                <Label htmlFor="order-original" className="text-xs font-semibold cursor-pointer">Theo thứ tự cũ</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Section 4 - Study Filter & Behaviors */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Hành vi phiên học</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="behavior-auto"
                  checked={localSettings.autoContinue}
                  onCheckedChange={(val: boolean) => updateSetting("autoContinue", val)}
                  className="rounded-md"
                />
                <Label htmlFor="behavior-auto" className="text-xs font-semibold cursor-pointer">Tự động qua câu khi trả lời đúng</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-2 justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 text-xs font-medium cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer px-5"
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
