"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { type ShortcutAction } from "@/lib/shortcuts";
import { useTranslations } from "next-intl";
import { useSettings } from "@/components/settings-context";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const keyDisplayMap = {};

export function ShortcutDialog({
  open,
  onOpenChange,
  settings,
  updateSetting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: any;
  updateSetting: (key: string, value: any) => void;
}) {
  const t = useTranslations("Settings");
  const tShortcuts = useTranslations("Shortcuts");
  const tShared = useTranslations("Shared");
  const [shortcuts, setShortcuts] = useState(settings.shortcuts);
  const [conflicts, setConflicts] = useState<Record<string, boolean>>({});
  const [focusedAction, setFocusedAction] = useState<ShortcutAction | null>(
    null
  );

  useEffect(() => {
    if (open) {
      setShortcuts(settings.shortcuts);
    }
  }, [settings.shortcuts, open]);

  const checkForConflicts = useCallback((currentShortcuts) => {
    const keyCounts: Record<string, number> = {};
    const newConflicts: Record<string, boolean> = {};

    Object.values(currentShortcuts).forEach((key) => {
      if (key) {
        keyCounts[key] = (keyCounts[key] || 0) + 1;
      }
    });

    Object.keys(currentShortcuts).forEach((action) => {
      const key = currentShortcuts[action];
      if (key && keyCounts[key] > 1) {
        newConflicts[action] = true;
      }
    });

    setConflicts(newConflicts);
    return Object.keys(newConflicts).length > 0;
  }, []);

  useEffect(() => {
    checkForConflicts(shortcuts);
  }, [shortcuts, checkForConflicts]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    action: ShortcutAction
  ) => {
    e.preventDefault();
    const { key, ctrlKey, shiftKey, altKey, metaKey } = e;

    if (key === "Escape") {
      setShortcuts((prev) => ({ ...prev, [action]: "" }));
      return;
    }

    const parts: string[] = [];
    if (ctrlKey) parts.push("Ctrl");
    if (altKey) parts.push("Alt");
    if (metaKey) parts.push("Meta");
    if (shiftKey) parts.push("Shift");

    let keyName = key;
    if (key === " ") {
      keyName = "Space";
    } else if (key.length > 1) {
      keyName = key.charAt(0).toUpperCase() + key.slice(1);
    }

    if (["Control", "Shift", "Alt", "Meta"].includes(keyName)) {
      return;
    }

    if (!parts.includes(keyName)) {
      parts.push(keyName);
    }

    const newShortcut = parts.join("+");

    setShortcuts((prev) => ({ ...prev, [action]: newShortcut }));
  };

  const handleSave = () => {
    if (checkForConflicts(shortcuts)) {
      toast.error(t("shortcutsSaveConflictError"), {
        position: "bottom-center",
      });
      return;
    }
    updateSetting("shortcuts", shortcuts);
    onOpenChange(false);
  };

  const hasConflicts = Object.keys(conflicts).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("shortcutsTitle")}</DialogTitle>
          <DialogDescription>{t("shortcutsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasConflicts && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 border border-destructive/30">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">
                {t("shortcutsConflictWarning")}
              </p>
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto pr-4 space-y-2 no-scrollbar">
            {Object.keys(settings.shortcuts).map((action: ShortcutAction) => {
              const hasConflict = conflicts[action];
              const currentKey = shortcuts[action] || "";
              const isActive = focusedAction === action;

              return (
                <Card
                  key={action}
                  className={`p-4 transition-colors cursor-text ${
                    isActive
                      ? "bg-primary/5 border-primary/50"
                      : hasConflict
                      ? "bg-destructive/5 border-destructive/50"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">
                        {tShortcuts(action)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("shortcutsAction", { action })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        value={currentKey}
                        onKeyDown={(e) => handleKeyDown(e, action)}
                        onFocus={() => setFocusedAction(action)}
                        onBlur={() => setFocusedAction(null)}
                        onChange={() => {}}
                        placeholder={t("shortcutsPressKey")}
                        className={`w-20 text-center font-mono text-sm h-9 ${
                          hasConflict
                            ? "border-destructive/50 bg-destructive/5"
                            : ""
                        }`}
                        readOnly
                      />

                      {hasConflict ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t("shortcutsConflict")}
                        </Badge>
                      ) : currentKey ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {t("shortcutsSet")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {t("shortcutsNotSet")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              {t("shortcutsQuickTips")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Kbd>Esc</Kbd>
                <span className="text-muted-foreground">
                  {t("shortcutsClear")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Kbd>Space</Kbd>
                <span className="text-muted-foreground">
                  {t("shortcutsWorksToo")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tShared("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={hasConflicts}>
            {t("shortcutsSave")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
