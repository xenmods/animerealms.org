"use client";

import type React from "react";

import { useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Settings } from "@/components/settings-context";
import { defaultSettings } from "@/components/settings-context";
import { Icon } from "@iconify/react";

interface ImportSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (settings: Settings) => void;
}

type DialogStep = "upload" | "preview" | "confirm";

export function ImportSettingsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportSettingsDialogProps) {
  const t = useTranslations("Settings");
  const tShared = useTranslations("Shared");
  const [step, setStep] = useState<DialogStep>("upload");
  const [parsedSettings, setParsedSettings] = useState<Settings | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (typeof parsed !== "object" || parsed === null) {
          throw new Error(t("importErrorObject"));
        }

        const allowedKeys = new Set(Object.keys(defaultSettings));
        const filteredSettings: Partial<Settings> = {};

        for (const key in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            if (allowedKeys.has(key)) {
              const parsedValue = parsed[key];
              const defaultValue = defaultSettings[key as keyof Settings];
              if (typeof parsedValue === typeof defaultValue) {
                (filteredSettings as any)[key] = parsedValue;
              }
            }
          }
        }

        if (Object.keys(filteredSettings).length === 0) {
          throw new Error(t("importErrorNoSettings"));
        }

        setParsedSettings(filteredSettings as Settings);
        setStep("preview");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("importErrorInvalidFormat")
        );
        setParsedSettings(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (parsedSettings) {
      onImport(parsedSettings);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep("upload");
    setParsedSettings(null);
    setFileName("");
    setFileSize(0);
    setError("");
    onOpenChange(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("importTitle")}</DialogTitle>
              <DialogDescription>{t("importDescription")}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                  "hover:bg-accent/50",
                  error && "border-destructive bg-destructive/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon
                  icon="solar:upload-linear"
                  className="mx-auto mb-3 w-8 h-8 text-muted-foreground"
                />
                <p className="font-medium text-foreground mb-1">
                  {t("importSelectFile")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("importDragAndDrop")}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {tShared("cancel")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && parsedSettings && (
          <>
            <DialogHeader>
              <DialogTitle>{t("importReviewTitle")}</DialogTitle>
              <DialogDescription>
                {t("importReviewDescription", { fileName })}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Icon
                  icon="solar:check-circle-broken"
                  className="w-5 h-5 text-green-500"
                />
              </div>

              <div className="bg-muted/50 border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                  {JSON.stringify(parsedSettings, null, 2)}
                </pre>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("importCount", {
                  count: Object.keys(parsedSettings).length,
                })}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                {t("importBack")}
              </Button>
              <Button onClick={() => setStep("confirm")}>
                {t("importContinue")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && parsedSettings && (
          <>
            <DialogHeader>
              <DialogTitle>{t("importConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {t("importConfirmDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {t("importSettingsToImport")}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {Object.entries(parsedSettings)
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <li
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span>{key}:</span>
                        <span className="font-mono text-xs text-foreground">
                          {typeof value === "boolean"
                            ? value
                              ? "true"
                              : "false"
                            : typeof value === "string"
                            ? `"${value}"`
                            : String(value)}
                        </span>
                      </li>
                    ))}
                  {Object.keys(parsedSettings).length > 8 && (
                    <li className="text-muted-foreground italic">
                      {t("importAndMore", {
                        count: Object.keys(parsedSettings).length - 8,
                      })}
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                {t("importReplaceWarning")}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("preview")}>
                {t("importBack")}
              </Button>
              <Button variant="destructive" onClick={handleImport}>
                {t("importAction")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
