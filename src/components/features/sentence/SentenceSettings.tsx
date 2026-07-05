// src/components/features/sentence/SentenceSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePersistedState } from "@/components/hooks/usePersistedState";

/**
 * Settings for the Sentence Practice mode.
 * Persisted via localStorage using usePersistedState.
 */
export interface SentenceSettingsState {
  language: string; // feedback language, e.g., "Vietnamese"
  strict: boolean; // enforce strict JSON output (always true for now)
  autoContinue: boolean; // automatically move to next word after evaluation
  showAdvancedRewrite: boolean; // show corrected/advanced sentence
  showAlternatives: boolean; // show alternative sentences
  showAIExplanation: boolean; // show AI explanation section
}

const DEFAULT_SETTINGS: SentenceSettingsState = {
  language: "Vietnamese",
  strict: true,
  autoContinue: false,
  showAdvancedRewrite: true,
  showAlternatives: true,
  showAIExplanation: true,
};

export function useSentenceSettings() {
  const [settings, setSettings] = usePersistedState<SentenceSettingsState>(
    "sentence_practice_settings",
    DEFAULT_SETTINGS
  );
  return { settings, setSettings };
}

export function SentenceSettings({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { settings, setSettings } = useSentenceSettings();
  const [local, setLocal] = useState(settings);

  // Sync local changes on open
  useEffect(() => {
    if (open) {
      setTimeout(() => setLocal(settings), 0);
    }
  }, [open, settings]);

  const apply = () => {
    setSettings(local);
    onOpenChange(false);
  };

  const toggle = (key: keyof SentenceSettingsState) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cài đặt chế độ luyện câu</DialogTitle>
          <DialogDescription>Điều chỉnh các tùy chọn hiển thị và ngôn ngữ phản hồi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span>Ngôn ngữ phản hồi</span>
            <select
              value={local.language}
              onChange={(e) => setLocal({ ...local, language: e.target.value })}
              className="border rounded p-1"
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English">English</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Tiếp tục tự động</span>
            <Switch checked={local.autoContinue} onChange={() => toggle("autoContinue")} />
          </div>
          <div className="flex items-center justify-between">
            <span>Hiển thị câu viết lại (cải tiến)</span>
            <Switch checked={local.showAdvancedRewrite} onChange={() => toggle("showAdvancedRewrite")} />
          </div>
          <div className="flex items-center justify-between">
            <span>Hiển thị câu thay thế</span>
            <Switch checked={local.showAlternatives} onChange={() => toggle("showAlternatives")} />
          </div>
          <div className="flex items-center justify-between">
            <span>Hiển thị giải thích AI</span>
            <Switch checked={local.showAIExplanation} onChange={() => toggle("showAIExplanation")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={apply}>Áp dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
