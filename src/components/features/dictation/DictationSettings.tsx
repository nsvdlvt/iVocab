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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export interface DictationSettings {
  enableWord: boolean;
  enableSentence: boolean;
  audioSpeed: number;
  autoReplayOnWrong: boolean;
  autoContinue: boolean;
  ignoreCase: boolean;
}

interface DictationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DictationSettings;
  onSaveSettings: (settings: DictationSettings) => void;
}

export function DictationSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
}: DictationSettingsDialogProps) {
  const [localSettings, setLocalSettings] = React.useState<DictationSettings>({ ...settings });

  // Sync settings when dialogue opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => setLocalSettings({ ...settings }), 0);
    }
  }, [open, settings]);

  const updateSetting = <K extends keyof DictationSettings>(key: K, value: DictationSettings[K]) => {
    setLocalSettings((prev) => {
      const next = { ...prev, [key]: value };
      
      // Enforce: At least one mode must remain selected
      if (!next.enableWord && !next.enableSentence) {
        if (key === "enableWord") next.enableSentence = true;
        else next.enableWord = true;
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
          <DialogTitle className="text-base font-extrabold text-foreground">Cấu hình chế độ Chính tả</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Điều chỉnh chế độ luyện viết chính tả theo nhu cầu học.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-5">
          {/* Section 1 - Dictation Mode */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Chế độ Dictation</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="mode-word"
                  checked={localSettings.enableWord}
                  onCheckedChange={(val: boolean) => updateSetting("enableWord", val)}
                  className="rounded-md"
                />
                <Label htmlFor="mode-word" className="text-xs font-semibold cursor-pointer">Luyện viết từ vựng</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="mode-sentence"
                  checked={localSettings.enableSentence}
                  onCheckedChange={(val: boolean) => updateSetting("enableSentence", val)}
                  className="rounded-md"
                />
                <Label htmlFor="mode-sentence" className="text-xs font-semibold cursor-pointer">Luyện viết ngữ cảnh câu</Label>
              </div>
            </div>
          </div>

          {/* Section 2 - Audio Playback Speed */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tốc độ đọc</h4>
            <RadioGroup
              value={localSettings.audioSpeed.toString()}
              onValueChange={(val: unknown) => updateSetting("audioSpeed", parseFloat(val as string))}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <RadioGroupItem id="speed-slow" value="0.75" className="text-indigo-600" />
                <Label htmlFor="speed-slow" className="text-xs font-semibold cursor-pointer">Chậm (0.75x)</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <RadioGroupItem id="speed-normal" value="1" className="text-indigo-600" />
                <Label htmlFor="speed-normal" className="text-xs font-semibold cursor-pointer">Thường (1.0x)</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <RadioGroupItem id="speed-fast" value="1.25" className="text-indigo-600" />
                <Label htmlFor="speed-fast" className="text-xs font-semibold cursor-pointer">Nhanh (1.25x)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Section 3 - Study Behaviors */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Hành vi phiên học</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="behavior-case"
                  checked={localSettings.ignoreCase}
                  onCheckedChange={(val: boolean) => updateSetting("ignoreCase", val)}
                  className="rounded-md"
                />
                <Label htmlFor="behavior-case" className="text-xs font-semibold cursor-pointer">Không phân biệt chữ hoa/thường</Label>
              </div>

              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="behavior-replay"
                  checked={localSettings.autoReplayOnWrong}
                  onCheckedChange={(val: boolean) => updateSetting("autoReplayOnWrong", val)}
                  className="rounded-md"
                />
                <Label htmlFor="behavior-replay" className="text-xs font-semibold cursor-pointer">Tự động phát lại âm thanh khi trả lời sai</Label>
              </div>

              <div className="flex items-center gap-2 rounded-xl border p-3 bg-muted/20">
                <Checkbox
                  id="behavior-auto"
                  checked={localSettings.autoContinue}
                  onCheckedChange={(val: boolean) => updateSetting("autoContinue", val)}
                  className="rounded-md"
                />
                <Label htmlFor="behavior-auto" className="text-xs font-semibold cursor-pointer">Tự động chuyển câu khi trả lời đúng</Label>
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
