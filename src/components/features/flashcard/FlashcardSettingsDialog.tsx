"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export interface FlashcardSettingsState {
  shuffle: boolean;
  autoplay: boolean;
  autoSpeak: boolean;
  autoplaySeconds: number;
  showIpa: boolean;
  showExamples: boolean;
}

interface FlashcardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: FlashcardSettingsState;
  onSave: (settings: FlashcardSettingsState) => void;
}

const AUTO_PLAY_OPTIONS = [3, 5, 8] as const;

export function FlashcardSettingsDialog({ open, onOpenChange, settings, onSave }: FlashcardSettingsDialogProps) {
  const [local, setLocal] = React.useState<FlashcardSettingsState>(settings);

  React.useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setLocal(settings), 0);
    return () => window.clearTimeout(handle);
  }, [open, settings]);

  const handleSave = () => {
    onSave(local);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg p-5 border shadow-xl bg-card">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-extrabold text-foreground">Flashcard settings</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tune the deck without changing the learning flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Shuffle deck</p>
              <p className="text-xs text-muted-foreground">Randomize the study order for this session.</p>
            </div>
            <Switch checked={local.shuffle} onChange={(checked) => setLocal((prev) => ({ ...prev, shuffle: checked }))} ariaLabel="Shuffle deck" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto flip</p>
              <p className="text-xs text-muted-foreground">Flip the active card after a short delay.</p>
            </div>
            <Switch checked={local.autoplay} onChange={(checked) => setLocal((prev) => ({ ...prev, autoplay: checked }))} ariaLabel="Auto flip cards" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto speak</p>
              <p className="text-xs text-muted-foreground">Speak the current card automatically when it appears.</p>
            </div>
            <Switch checked={local.autoSpeak} onChange={(checked) => setLocal((prev) => ({ ...prev, autoSpeak: checked }))} ariaLabel="Auto speak cards" />
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Auto flip delay</p>
                <p className="text-xs text-muted-foreground">Choose when the card flips automatically.</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
                {AUTO_PLAY_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...prev, autoplaySeconds: seconds }))}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      local.autoplaySeconds === seconds ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Show IPA</p>
                <p className="text-xs text-muted-foreground">Keep pronunciation visible on the front.</p>
              </div>
              <Switch checked={local.showIpa} onChange={(checked) => setLocal((prev) => ({ ...prev, showIpa: checked }))} ariaLabel="Show IPA" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Show examples</p>
                <p className="text-xs text-muted-foreground">Reveal example sentences on the back.</p>
              </div>
              <Switch checked={local.showExamples} onChange={(checked) => setLocal((prev) => ({ ...prev, showExamples: checked }))} ariaLabel="Show examples" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 text-xs font-medium cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-xl h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer px-5">
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
